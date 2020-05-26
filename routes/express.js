const fetch = require('node-fetch')
const configuration = require('../support/configuration')
const { URLSearchParams } = require('url')


module.exports = (app, provider) => {
  function setNoCache(req, res, next) {
    res.set('Pragma', 'no-cache')
    res.set('Cache-Control', 'no-cache, no-store')
    next()
  }

  app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
    try {
      const { uid, prompt } = await provider.interactionDetails(req, res)

      if (prompt.name === 'login') {
        res.status(200).json({uid: uid})
      }

      if (prompt.name === 'consent') {
        const result = { consent: { rejectedScopes: [], rejectedClaims: [], replace: false } }
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
      }
    } catch (err) {
      return next(err)
    }
  })

  function decodeJwt(token) {
    const base64Url = token.split('.')[1]
    return JSON.parse(Buffer.from(decodeURIComponent(base64Url), 'base64').toString('binary'))
  }

  function toBase64(str) {
    return Buffer.from(str).toString('base64')
  }

  const clientId = configuration.clients[0].client_id
  const clientSecret = configuration.clients[0].client_secret

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
