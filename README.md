# Example of an OpenId authentication server
###Start project locally:
* to run the Front-end: run `start` from "client/" folder
* to run the Back-end: run `develop` from "server/" folder

Don't be confused - in development the React.js Front-end is served on a different port,
 BUT PROXIED to the same port as the back-end 
---

#### Run production build
* to run a production version: run `start:production` from "server/" folder 
---

> ##### Just to remember: 
>
> login - url
> 
> http://localhost:3000/auth?client_id=example_oidc&response_type=code&scope=openid%20email%20offline_access&redirect_uri=http://localhost:3000/callback
> 
> login with refresh token - url
> 
> http://localhost:3000/auth?client_id=example_oidc&response_type=code&scope=openid%20email%20offline_access&prompt=consent&redirect_uri=http://localhost:3000/callback
