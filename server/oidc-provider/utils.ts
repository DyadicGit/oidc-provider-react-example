import { JWK, JWT } from "jose";
import config from "../environment";
import { findUserByEmail } from "./account";

const { oidc } = config;
const { decodeBase64String } = require('./base64-utils');

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.sendStatus(401);
  }
  const [type, accessToken] = authHeader.split(' ');
  if (type === 'incognito') {
    const incognitoId = decodeBase64String(accessToken);
    req.user = { id: incognitoId, email: null, token: null };
    return next();
  }
  // @ts-ignore
  const keystore = JWK.asKey(oidc.jwks_keys[0]);
  try {
    const decodedJWT = await JWT.verify(decodeBase64String(accessToken), keystore);
    // @ts-ignore
    req.user = await findUserByEmail(decodedJWT.sub);
    return next();
  } catch (e) {
    return res.sendStatus(401);
  }
};

module.exports = { verifyJWT };
