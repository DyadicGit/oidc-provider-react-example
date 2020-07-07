import { Configuration } from 'oidc-provider/types';
import environment from '../environment';
const { oidc } = environment

const { findAccount } = require('./account');

const configuration: Configuration = {
  clients: [
    {
      client_id: oidc.client_id,
      client_secret: oidc.client_secret,
      grant_types: ['refresh_token', 'authorization_code'],
      redirect_uris: [oidc.callback],
      response_types: ['code'],
    },
  ],
  findAccount,
  logoutSource: async (ctx, form) => {
    const xsrf = form.match(/name="xsrf" value="\w+"/g)[0].replace('name="xsrf" value=', '').match(/\w+/)[0];
    // @ts-ignore
    ctx.res.json({ xsrf });
  },
  cookies: {
    long: { signed: true, path: '/' },
    short: { signed: true, path: '/' },
    keys: oidc.cookie_keys,
  },
  claims: {
    email: ['email', 'email_verified'],
    app_profile: ['id', 'token'],
  },
  features: {
    devInteractions: { enabled: false },
    deviceFlow: { enabled: false },
    introspection: { enabled: true },
    revocation: { enabled: true },
  },
  jwks: {
    // @ts-ignore
    keys: oidc.jwks_keys,
  },
  formats: { AccessToken: 'jwt' },
};
export default configuration;
