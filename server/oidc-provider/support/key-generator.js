const { JWKS: { KeyStore } } = require('jose');

const keystore = new KeyStore();
keystore.generateSync('RSA', 2048, { alg: 'RS256', use: 'sig' }); // <== used this one, only for signing
const generatedKey = keystore.toJWKS(true);
console.log('this is the full private JWKS:\n', generatedKey);

const { encodeBase64String } = require('../../../../../util/base64-utils');

console.log('JWKS as base64 string:', encodeBase64String(JSON.stringify(generatedKey.keys))); // Hack for AWS, it deletes all double-quotes

const cookieKeys = process.env.OIDC_COOKIE_KEYS || JSON.stringify(['some secret key', 'and also the old rotated away some time ago', 'and one more']);
console.log('Cookie keys as base64 string:', encodeBase64String(cookieKeys));

const keystoreForSigningAndEncryption = new KeyStore();
Promise.all([
  keystoreForSigningAndEncryption.generate('RSA', 2048, { use: 'sig' }),
  keystoreForSigningAndEncryption.generate('RSA', 2048, { use: 'enc' }),
  keystoreForSigningAndEncryption.generate('EC', 'P-256', { use: 'sig' }),
  keystoreForSigningAndEncryption.generate('EC', 'P-256', { use: 'enc' }),
  keystoreForSigningAndEncryption.generate('OKP', 'Ed25519', { use: 'sig' }),
]).then(() => {
  console.log(
    `Re-using the same keys for both encryption and signing is discouraged so it 
  is best to generate one with { use: 'sig' } and another with { use: 'enc' }, e.g.:`,
    keystoreForSigningAndEncryption.toJWKS(true)
  );
});
