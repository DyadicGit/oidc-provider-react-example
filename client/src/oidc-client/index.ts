// @ts-ignore
import { v4 as uuidV4 } from 'uuid';
import config from './config'
const DOMAIN_URL = config.oidc.provider_domain;
const CLIENT_ID = config.oidc.client_id
const CALLBACK = config.oidc.callback

enum HandledErrors {
  'TOKEN_REVOKED'= 'invalid_grant'
}

interface IntrospectionResponse {
  active: boolean
  client_id?: string
  exp?: number
  iat?: number
  iss?: string
  jti?: string
  scope?: 'openid email offline_access' | string
  sub?: string // email of user
  token_type?: 'Bearer' | string
}
interface UserInfoResponse {
  email: string | null
  id: string
  sub: string | null // the same email
  token: string | null
}
export interface Token {
  access_token: string
  expires_in: number
  id_token: string
  refresh_token: string
  scope: 'openid email offline_access' | 'openid email'
  token_type: 'Bearer'
}
interface UidResponse {
  uid: string
}

export type Status = 'PROVIDE_CREDENTIALS' | 'AUTHENTICATED' | 'LOGGED_OUT' | 'ERROR'
export interface AuthReturnType {
  status: Status
  message?: string
}

const storageToken = sessionStorage;
const storageUser = localStorage;

export const storage = {
  storeToken: (token: Token): void => storageToken.setItem('token', JSON.stringify(token)),
  removeToken: (): void => storageToken.removeItem('token'),
  retrieveToken: (): Token | null => {
    // @ts-ignore
    return JSON.parse(storageToken.getItem('token'));
  },
  storeUser: (user: UserInfoResponse): UserInfoResponse => {
    storageUser.setItem('user', JSON.stringify(user))
    return user
  },
  removeUser: (): void => storageUser.removeItem('user'),
  retrieveUser: async (): Promise<UserInfoResponse> => {
    const meCached = JSON.parse(storageUser.user || null);
    const me = oidcApi.userInfo().then(storage.storeUser);

    if (meCached) {
      return Promise.resolve(meCached);
    }
    return me;
  },
  removeAll: () => {
    storage.removeToken();
    storage.removeUser();
  },
};


const isValid = async (accessOrRefreshToken: string):Promise<boolean> => {
  // eslint-disable-next-line no-use-before-define
  return (await oidcApi.introspectToken(accessOrRefreshToken)).active;
};

export const provideMeCredentials = async (login: string, password: string, retry: number = 0): Promise<AuthReturnType | undefined> => {
  const resp = await fetch(`${DOMAIN_URL}/oidc/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: encodeURIComponent(login), password: encodeURIComponent(password) }),
  });
  if (!resp.ok) {
    try {
      if (retry < 3) {
        // eslint-disable-next-line no-use-before-define
        const { status } = await authenticate() || { status: undefined };
        if (status === 'PROVIDE_CREDENTIALS') {
          return await provideMeCredentials(login, password, retry + 1);
        }
      }
      const { error } = await resp.json();
      return { status: 'ERROR', message: error };
    } catch (e) {
      console.error('Authentication grant error');
      return { status: 'ERROR', message: 'Backend is temporarily unavailable. Please try again later' };
    }
  }
  const token: Token = await resp.json();
  // eslint-disable-next-line no-use-before-define
  return authenticate(token);
};

export const oidcApi = {
  grantCodeOrToken: async (): Promise<Token | UidResponse> => {
    const loginWithRefresh = `${DOMAIN_URL}/oidc/auth?client_id=${CLIENT_ID}&response_type=code&scope=openid%20email%20offline_access%20app_profile&prompt=consent&redirect_uri=${CALLBACK}`;
    const response = await fetch(loginWithRefresh);
    if (!response.ok) {
      try {
        const { error } = await response.json();
        throw Error(error);
      } catch (e) {
        throw Error(e.message || 'login failed');
      }
    }
    return response.json();
  },
  rotateToken: async (token: Token): Promise<Token|null> => {
    const resp = await fetch(`${DOMAIN_URL}/oidc/refresh?refresh_token=${token.refresh_token}`);
    if (!resp.ok) {
      const { error } = await resp.json();
      if (error && error === HandledErrors.TOKEN_REVOKED) {
        return null;
      }
      throw Error('token refresh grant failed');
    }

    return resp.json();
  },
  introspectToken: async (accessOrRefreshToken: string): Promise<IntrospectionResponse> => {
    const resp = await fetch(`${DOMAIN_URL}/oidc/validate?token=${accessOrRefreshToken}`);
    return resp.json();
  },
  revokeToken: async (accessOrRefreshToken: string): Promise<boolean> => {
    const resp = await fetch(`${DOMAIN_URL}/oidc/revoke?token=${accessOrRefreshToken}`);
    return resp.ok;
  },
  endSession: async (): Promise<boolean> => {
    const resp = await fetch(`${DOMAIN_URL}/oidc/session/end`);
    const { xsrf } = await resp.json();
    const confirm = await fetch(`${DOMAIN_URL}/oidc/session/end/confirm`, {
      body: `xsrf=${xsrf}&logout=yes`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return confirm.ok;
  },
  userInfo: async (): Promise<UserInfoResponse> => {
    // eslint-disable-next-line no-use-before-define
    const token = storage.retrieveToken();
    if (!token || !token.access_token) throw Error('INCOGNITO_USER');

    const headers = { Authorization: `Bearer ${token.access_token}` };
    const resp = await fetch(`${DOMAIN_URL}/oidc/me`, { headers });
    if (!resp.ok) {
      const { error } = await resp.json();
      throw Error(`INVALID_TOKEN${error}`);
    }
    return resp.json();
  },
};

export const authenticate = async (token = storage.retrieveToken()): Promise<AuthReturnType | undefined> => {
  try {
    if (!token) {
      const data = await oidcApi.grantCodeOrToken();
      if ('uid' in data) {
        return { status: 'PROVIDE_CREDENTIALS' };
      }
      storage.storeToken(data);
      await storage.retrieveUser();
      return { status: 'AUTHENTICATED' };
    }

    if (await isValid(token.access_token)) {
      storage.storeToken(token);
      await storage.retrieveUser();
      return { status: 'AUTHENTICATED' };
    }

    const newToken = await oidcApi.rotateToken(token);
    if (newToken) {
      storage.storeToken(newToken);
      await storage.retrieveUser();
      return { status: 'AUTHENTICATED' };
    }
    storage.removeAll();
    return authenticate(null);
  } catch (e) {
    console.error('tokenManager:', e);
    storage.removeAll();
    return { status: 'ERROR', message: e.message };
  }
};

export const logout = async () => {
  try {
    const token = storage.retrieveToken();
    if (token) {
      await oidcApi.revokeToken(token.access_token);
      await oidcApi.revokeToken(token.refresh_token);
      await oidcApi.endSession();
    }
    storage.removeAll();
  } catch (e) {
    storage.removeAll();
  }
};

export const validateToken = (doIfNotValid: () => void) => {
  try {
    const token = storage.retrieveToken();
    if (token) {
      const checkFn = () => isValid(token.access_token).then((valid) => {
        if (!valid) {
          doIfNotValid();
          // @ts-ignore
          clearInterval(window.intervalId);
        }
      });
      checkFn();
      // @ts-ignore
      window.intervalId = setInterval(checkFn, token.expires_in * 1000);
    } else {
      doIfNotValid();
    }
  } catch (e) {
    doIfNotValid();
  }
};
