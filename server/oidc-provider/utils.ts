import { JWK, JWT } from "jose";
import config from "../server-config";
import { findUserByEmail } from "./account";
import assert from "assert";

const { oidc } = config;
const { decodeBase64String } = require('./base64-utils');

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.sendStatus(401);
  }
  const [type, accessToken] = authHeader.split(' ');
  assert(type === 'Bearer')
  // @ts-ignore
  const keystore = JWK.asKey(oidc.jwks_keys[0]);
  try {
    const decodedJWT: any = await JWT.verify(decodeBase64String(accessToken), keystore);
    const user = findUserByEmail(decodedJWT.sub);
    if (!user) {
      res.status(401).send('user does not exist');
    } else {
      next();
    }
  } catch (e) {
    return res.sendStatus(401);
  }
};

export { verifyJWT };
