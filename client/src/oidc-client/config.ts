const config = {
  oidc: {
    provider_domain: '',  // it's proxied, so no need to specify domain-url
    client_id: 'example_oidc',
    client_secret: 'some_secret_password',
    callback: `http://localhost:3000/callback`,
  }
}

export default config;
