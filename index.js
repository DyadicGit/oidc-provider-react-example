/* eslint-disable no-console */

const path = require('path')
const url = require('url')

const set = require('lodash/set')
const express = require('express')
const helmet = require('helmet')

const { Provider } = require('oidc-provider')

const Account = require('./support/account')
const configuration = require('./support/configuration')
const routes = require('./routes/express')

const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env
configuration.findAccount = Account.findAccount

const app = express()
app.use(helmet())

let server;
(async () => {
  let adapter
  if (process.env.DB_ON === 'ON' && process.env.MONGODB_URI) {
    adapter = require('./adapters/mongodb') // eslint-disable-line global-require
    await adapter.connect()
  }
  const provider = new Provider(ISSUER, { adapter, ...configuration })

  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy')
    provider.proxy = true
    set(configuration, 'cookies.short.secure', true)
    set(configuration, 'cookies.long.secure', true)

    app.use((req, res, next) => {
      if (req.secure) {
        next()
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        res.redirect(
          url.format({
            protocol: 'https',
            host: req.get('host'),
            pathname: req.originalUrl
          })
        )
      } else {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'use https'
        })
      }
    })
  }

  app.use('/', express.static('./views-react/dist/app/'))
  app.use('/login', express.static('./views-react/dist/login/'))
  routes(app, provider)

  app.post('/oidc/login', express.json(), async (req, res, next) => {
    try {
      const { prompt: { name } } = await provider.interactionDetails(req, res)
      const account = await Account.findByLogin(req.body.login)
      const result = { login: { account: account.accountId } }
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  app.use('/oidc', provider.callback)
  server = app.listen(PORT, () => {
    console.log(`application is listening on port ${PORT}, check its http://localhost:${PORT}/.well-known/openid-configuration`)
  })
})().catch(err => {
  if (server && server.listening) server.close()
  console.error(err)
  process.exitCode = 1
})
