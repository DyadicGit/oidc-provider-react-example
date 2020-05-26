const { JWKS: { KeyStore } } = require('jose');
const keystore = new KeyStore();
keystore.generateSync('RSA', 2048, { alg: 'RS256', use: 'sig' });
console.log('this is the full private JWKS:\n', keystore.toJWKS(true));


const keystoreForSigningAndEncryption = new KeyStore();
Promise.all([
  keystoreForSigningAndEncryption.generate('RSA', 2048, { use: 'sig' }),
  keystoreForSigningAndEncryption.generate('RSA', 2048, { use: 'enc' }),
  keystoreForSigningAndEncryption.generate('EC', 'P-256', { use: 'sig' }),
  keystoreForSigningAndEncryption.generate('EC', 'P-256', { use: 'enc' }),
  keystoreForSigningAndEncryption.generate('OKP', 'Ed25519', { use: 'sig' }),
]).then(function () {
  console.log(
    `Re-using the same keys for both encryption and signing is discouraged so it 
  is best to generate one with { use: 'sig' } and another with { use: 'enc' }, e.g.:`,
    keystoreForSigningAndEncryption.toJWKS(true));
});
