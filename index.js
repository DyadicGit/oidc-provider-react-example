/* eslint-disable no-console */

const path = require('path');
const url = require('url');

const set = require('lodash/set');
const express = require('express'); // eslint-disable-line import/no-unresolved
const helmet = require('helmet');

const { Provider } = require('oidc-provider');

const Account = require('./support/account');
const configuration = require('./support/configuration');
const routes = require('./routes/express');

const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;
configuration.findAccount = Account.findAccount;

const app = express();
app.use(helmet());

app.set('views', path.join(__dirname, 'views-react/dist/login'));
app.set('view engine', 'ejs');

let server;
(async () => {
  let adapter;
  if (process.env.DB_ON === 'ON' && process.env.MONGODB_URI) {
    adapter = require('./adapters/mongodb'); // eslint-disable-line global-require
    await adapter.connect();
  }
  configuration.interactions = {
    url(ctx, interaction) {
      return `/interaction/${ctx.oidc.uid}`;
    },
  }
  const provider = new Provider(ISSUER, { adapter, ...configuration });

  // http dev mode
/*  const { invalidate: orig } = provider.Client.Schema.prototype;

  provider.Client.Schema.prototype.invalidate = function invalidate(message, code) {
    if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
      return;
    }

    orig.call(this, message);
  };*/

  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    provider.proxy = true;
    set(configuration, 'cookies.short.secure', true);
    set(configuration, 'cookies.long.secure', true);

    app.use((req, res, next) => {
      if (req.secure) {
        next();
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        res.redirect(url.format({
          protocol: 'https',
          host: req.get('host'),
          pathname: req.originalUrl,
        }));
      } else {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'do yourself a favor and only use https',
        });
      }
    });
  }

  routes(app, provider);
  app.use('/', express.static('./views-react/dist/app/'))
  app.use('/login', express.static('./views-react/dist/login/'))

  app.post('/my/:uid/login', async (req, res, next) => {
    try {
      const { prompt: { name } } = await provider.interactionDetails(req, res)
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
  app.use('/oidc',provider.callback);
  server = app.listen(PORT, () => {
    console.log(`application is listening on port ${PORT}, check its http://localhost:${PORT}/.well-known/openid-configuration`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
