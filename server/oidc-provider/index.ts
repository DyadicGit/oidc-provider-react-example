import express from 'express'
import fetch from "node-fetch";
import url, { URLSearchParams } from "url";
// @ts-ignore
import { Provider } from 'oidc-provider';
import environment from '../environment';
import configuration from './configuration';
import { findUserByEmail } from './account';

const { oidc } = environment
const DOMAIN_URL = oidc.provider_domain;
const oidcApp = express();

const provider = new Provider(DOMAIN_URL, configuration);

function toBase64(str) {
  return Buffer.from(str).toString('base64');
}

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  Authorization: `Basic ${toBase64(`${oidc.client_id}:${oidc.client_secret}`)}`,
};

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
  oidcApp.enable('trust proxy');
  provider.proxy = true;
  configuration.cookies.short.secure = true;
  configuration.cookies.long.secure = true;

  oidcApp.use((req, res, next) => {
    if (req.secure) {
      next();
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      res.redirect(
        url.format({
          protocol: 'https',
          host: req.get('host'),
          pathname: req.originalUrl,
        })
      );
    } else {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'use https',
      });
    }
  });
}

function setNoCache(req, res, next) {
  res.set('Pragma', 'no-cache');
  res.set('Cache-Control', 'no-cache, no-store');
  next();
}

oidcApp.get('/interaction/:uid', setNoCache, async (req, res, next) => {
  try {
    const interaction = await provider.interactionDetails(req, res);
    const { uid, prompt } = interaction;

    if (prompt.name === 'login') {
      res.status(200).json({ uid });
    }

    if (prompt.name === 'consent') {
      const result = { consent: { rejectedScopes: [], rejectedClaims: [], replace: false } };
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    }
  } catch (err) {
    console.error(JSON.stringify(err));
    next(err);
  }
});

oidcApp.get('/callback', async (req, res, next) => {
  try {
    const { query } = req;
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    // @ts-ignore
    body.append('code', query.code);
    body.append('redirect_uri', oidc.callback);

    const data = await (await fetch(`${DOMAIN_URL}/oidc/token`, { method: 'post', headers, body: body.toString() })).json();
    if (data.error) { throw Error(JSON.stringify(data)); }
    res.json(data);
  } catch (e) {
    console.error('in authorization grant', e);
    next(e);
  }
});

// custom routes below (not oidc-provider default) :
oidcApp.post('/oidc/login', express.json(), async (req, res, next) => {
  const { login, password } = req.body;
  try {
    const user = await findUserByEmail(decodeURIComponent(login));
    if (!user) {
      res.status(401).json({ error: 'User does not exist' });
      return;
    }

    if (user.password.toString() !== decodeURIComponent(password)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const result = { login: { account: user.email } };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (e) {
    console.log('/oidc/login', e);
    res.status(400).json({ error: e.name });
    next(e);
  }
});

oidcApp.get('/oidc/refresh', async (req, res, next) => {
  try {
    const { refresh_token: refreshToken } = req.query;
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    // @ts-ignore
    body.append('refresh_token', refreshToken);
    body.append('scope', 'openid');

    const data = await (await fetch(`${DOMAIN_URL}/oidc/token`, { method: 'post', headers, body: body.toString() })).json();
    if (data.error && data.error === 'invalid_grant') {
      res.status(400).json(data);
      return;
    }
    if (data.error) { throw Error(JSON.stringify(data)); }
    res.json(data);
  } catch (e) {
    console.error('in refresh grant', e);
    next(e);
  }
});

oidcApp.get('/oidc/validate', async (req, res, next) => {
  try {
    const body = new URLSearchParams();
    // @ts-ignore
    body.append('token', req.query.token);
    const data = await (await fetch(`${DOMAIN_URL}/oidc/token/introspection`, { method: 'post', headers, body: body.toString() })).json();

    if (data.error) { throw Error(JSON.stringify(data)); }
    res.json(data);
  } catch (e) {
    console.error('in introspection', e);
    next(e);
  }
});
oidcApp.get('/oidc/revoke', async (req, res, next) => {
  try {
    const body = new URLSearchParams();
    // @ts-ignore
    body.append('token', req.query.token);

    const response = await fetch(`${DOMAIN_URL}/oidc/token/revocation`, { method: 'post', headers, body: body.toString() });
    if (response.ok) { res.status(200).send(true); }
    if (!response.ok) { res.status(401).send(false); }
  } catch (e) {
    console.error('in revocation', e);
    next(e);
  }
});

const baseEndpoint = '/oidc';
oidcApp.use(baseEndpoint, provider.callback);

console.log(`oidc-provider configuration at ${DOMAIN_URL}${baseEndpoint}/.well-known/openid-configuration`);

export { oidcApp as oidcProvider };
