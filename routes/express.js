/* eslint-disable no-console, max-len, camelcase, no-unused-vars */
const { strict: assert } = require('assert')
const querystring = require('querystring')
const { inspect } = require('util')
const fetch = require('node-fetch')

const isEmpty = require('lodash/isEmpty')
const { urlencoded } = require('express') // eslint-disable-line import/no-unresolved

const Account = require('../support/account')

const body = urlencoded({ extended: false })

const keys = new Set()
const debug = obj =>
  querystring.stringify(
    Object.entries(obj).reduce((acc, [key, value]) => {
      keys.add(key)
      if (isEmpty(value)) return acc
      acc[key] = inspect(value, { depth: null })
      return acc
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value
      }
    }
  )

module.exports = (app, provider) => {
  const {
    constructor: {
      errors: { SessionNotFound }
    }
  } = provider

  app.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (err) throw err
        orig.call(res, '_layout', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })

  function setNoCache(req, res, next) {
    res.set('Pragma', 'no-cache')
    res.set('Cache-Control', 'no-cache, no-store')
    next()
  }

  app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res)

      const client = await provider.Client.find(params.client_id)

      switch (prompt.name) {
        case 'select_account': {
          if (!session) {
            return provider.interactionFinished(req, res, { select_account: {} }, { mergeWithLastSubmission: false })
          }

          const account = await provider.Account.findAccount(undefined, session.accountId)
          const { email } = await account.claims('prompt', 'email', { email: null }, [])

          return res.render('select_account', {
            client,
            uid,
            email,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          })
        }
        case 'login': {
          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          })
        }
        case 'consent': {
          const removeConsentForm = true;
          if (removeConsentForm) {
            const result = {
              consent: {
                rejectedScopes: [],
                rejectedClaims: [],
                replace: false
              }
            }
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            break;
          }
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          })
        }
        default:
          return undefined
      }
    } catch (err) {
      return next(err)
    }
  })

  app.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
    try {
      const {
        prompt: { name }
      } = await provider.interactionDetails(req, res)
      assert.equal(name, 'login')
      const account = await Account.findByLogin(req.body.login)

      const result = {
        select_account: {}, // make sure its skipped by the interaction policy since we just logged in
        login: {
          account: account.accountId
        }
      }

      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  app.post('/interaction/:uid/continue', setNoCache, body, async (req, res, next) => {
    try {
      const interaction = await provider.interactionDetails(req, res)
      const {
        prompt: { name, details }
      } = interaction
      assert.equal(name, 'select_account')

      if (req.body.switch) {
        if (interaction.params.prompt) {
          const prompts = new Set(interaction.params.prompt.split(' '))
          prompts.add('login')
          interaction.params.prompt = [...prompts].join(' ')
        } else {
          interaction.params.prompt = 'login'
        }
        await interaction.save()
      }

      const result = { select_account: {} }
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  app.post('/interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
    try {
      const {
        prompt: { name }
      } = await provider.interactionDetails(req, res)
      assert.equal(name, 'consent')

      const result = {
        consent: {
          rejectedScopes: [],
          rejectedClaims: [],
          replace: false
        }
      }
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true })
    } catch (err) {
      next(err)
    }
  })

  app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction'
      }
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  app.use((err, req, res, next) => {
    if (err instanceof SessionNotFound) {
      // handle interaction expired / session not found error
      console.log('interaction expired / session not found error')
    }
    next(err)
  })

  function decodeJwt(token) {
    const base64Url = token.split('.')[1]
    return JSON.parse(Buffer.from(decodeURIComponent(base64Url), 'base64').toString('binary'))
  }

  function toBase64(str) {
    return Buffer.from(str).toString('base64')
  }

  const { encode, decode } = require('oidc-provider/lib/helpers/base64url')
  const configuration = require('../support/configuration')
  const clientId = configuration.clients[0].client_id
  const clientSecret = configuration.clients[0].client_secret
  const { URLSearchParams } = require('url')

  app.get('/callback', (req, res) => {
    const { params, query } = req
    const body = new URLSearchParams()
    body.append('grant_type', 'authorization_code')
    body.append('code', query.code)
    body.append('redirect_uri', 'http://localhost:3000/callback')

    const headersBasic = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${toBase64(`${clientId}:${clientSecret}`)}`
    }

    fetch(`http://localhost:3000/token`, { method: 'post', headers: headersBasic, body })
      .then(res => res.json())
      .then(data => {
        const jwt = decodeJwt(data.access_token)
        res.json({ ...data, jtw: jwt, expired: jwt.exp * 1000 < Date.now() })
      })
      .catch(e => {
        console.log(e)
      })
  })
}
