const { strict: assert } = require('assert')
const querystring = require('querystring')
const { inspect } = require('util')
const fetch = require('node-fetch')
const { urlencoded } = require('express')

const Account = require('../support/account')

const body = urlencoded({ extended: false })

module.exports = (app, provider) => {
  const { constructor: { errors: { SessionNotFound } } } = provider

  function setNoCache(req, res, next) {
    res.set('Pragma', 'no-cache')
    res.set('Cache-Control', 'no-cache, no-store')
    next()
  }

  app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res)

      if (prompt.name === 'login') {
        res.status(200).json({uid: uid})
        return ;
      }
      if (prompt.name === 'consent') {
        const result = { consent: { rejectedScopes: [], rejectedClaims: [], replace: false } }
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
      }
    } catch (err) {
      return next(err)
    }
  })

  app.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
    try {
      const { prompt: { name } } = await provider.interactionDetails(req, res)
      assert.equal(name, 'login')
      const account = await Account.findByLogin(req.body.login)

      const result = {
        login: {
          account: account.accountId
        }
      }

      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
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

  function decodeJwt(token) {
    const base64Url = token.split('.')[1]
    return JSON.parse(Buffer.from(decodeURIComponent(base64Url), 'base64').toString('binary'))
  }

  function toBase64(str) {
    return Buffer.from(str).toString('base64')
  }

  const configuration = require('../support/configuration')
  const clientId = configuration.clients[0].client_id
  const clientSecret = configuration.clients[0].client_secret
  const { URLSearchParams } = require('url')

  app.get('/callback', (req, res) => {
    const { query } = req
    const body = new URLSearchParams()
    body.append('grant_type', 'authorization_code')
    body.append('code', query.code)
    body.append('redirect_uri', 'http://localhost:3000/callback')

    const headersBasic = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${toBase64(`${clientId}:${clientSecret}`)}`
    }

    fetch(`http://localhost:3000/oidc/token`, { method: 'post', headers: headersBasic, body })
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
