const PORT = 3000;

const environment = {
  PORT: PORT,
  oidc: {
    provider_domain: `http://localhost:${PORT}`,
    client_id: 'example_oidc',
    client_secret: 'some_secret_password',
    callback: `http://localhost:${PORT}/callback`,
    cookie_keys: ["some secret key","and also the old rotated away some time ago","and one more"],
    jwks_keys: [{"e":"AQAB","n":"uDD_Uo84z2XtQdWHR08p3im1dtynlfb_A9KRg_P3QY_Y9nXWFe0NhzKZfk-MzItRInXyoQCLUuIkYu5aCTGtWkoMqASqPsuMqOISKx7Hiips8Dfgt4qkJifQTVLl0F9jInV7krdJjGGmnyqBbat-HV9uXHvkesJetmItypt2g_UAneRXz8rkUzKgozZNA_Tl5sR-esVNJjdKBEOf7BKUD-Vj8kefUIZ6qt1gqjvrXfcWRgN_E1WnAjwKQJJ6D_v1IMXunfMEORqngS91eGkX5BSYfyB8Zv-K9cihnH_9RJJgSG8rFjF-Di-jnaOZlIyYYNCe-nr67vwitOtiR-Vo3w","d":"k0AQjkcTirKYp332RSrjdMlxWhHzJC-vFbY8QPpEHDTMpdP0j9jQbNol3dXo4QkrltomW1JdD6jcn_6fGiSNytXSImyAUe1WiRkan0BfE3TxXGW_j9wVeK9xlq-ELD5luYGkhdljwge7Nhm8GRn1m7PUPbmKIh3LrBD3PLdmWvyhZDyFE3jqI19Tp0KBWVndmXD914NGFkXssZsmL3Ly_7VOmbCQPPphDYoaGV45I03nLsomoFq8h0fmYUo6XdySbh0TxEi_EEdLS2pfPlFbAUU0fz2qXxHRMKVuFXbWDOF-rP3PiomF_uzBu56vgWJKKeBi5kuyvNoqLpVW-OMZWQ","p":"72fECWypnng9uOFjZHlR4vuzKlgH47DivcY_wFNHDOlC_EI_yVTL-_lf3lRHc5IPJqjQtm9UGUUZefYV9A5mf9ZinP1gpq-9qD95jEpxWVJVCtcNZEmiiAL7ZY7btlvI2rZAwI49ldH580NZdTAtJkDR-wFdMQmmgZgHsSejOas","q":"xPV2nRVlckJcJkXExk9VIF2U24YGn4GYLVsD45w_tqadpPg_QULN5cvdbQ3luBX8FYb1urKv6p1ZOMTzK6zufL0VO-CRaS9eUYV0K10sv25d2x6O2jugkO7KwjU5i9vxmGFchizZprqy2-ku2PbZzpRyz09W3RTACivRpkcUIZ0","dp":"xNc_ozQZ_rcEoMeIzmrF_mhPduhsjDS7KaggcMTILYB5WCosgiBbm_D9dzM6kHauSG4TNX0x25kqClJg2Isikce2yze1yTfEK9sM2GG48uU0ETaixyuYHFa_V1BvrG-pJNMnSGtrjYzZA8ADhMw4wzQWslf7xL8XjYRwBqP9nAM","dq":"DVEHTwGWVU5VSqUm872DZOfO27TJF9m8PzzLG4WB7UiAmhnKtQ_eOe45r1jkMjkSTSZN0Oyp5jPzR1pRkp9jlH14RQ8e5by1JM_gFdp73wmIQPtk7y5e4c2zWcQdeu5I_GOAzPWVVaeD1kiCyVqPSV9SD-AuYE452bYyu4pMuyU","qi":"htb27cSDel4E74Ypc672eW-Vg1Cofptfz09lEcF9uYnGjRaKCQXudjsvEAb97b1q-xxnioJG0hOyq5rm3Nkt0AK2YAxejSkDo71vBbewkuC-S-DNU4gbV_mWzHmdNpUta9LXIcSlxN0083tiiAFUXq0b0uciShhTyTQbCpmiu24","kty":"RSA","kid":"LWTp2LMT6VnpNOeJfT1DD71GZrL5hUZSXAVy9RBRmJY","alg":"RS256","use":"sig"}],
  }
}

export default environment;
