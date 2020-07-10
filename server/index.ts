import express from 'express'
import { userApi } from "./api-users";
import serverConfig from './server-config';
import { oidcProvider } from "./oidc-provider";
const app = express()

// Cors
const cacheHours = 24 * 60 * 60; // 24 hours
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', `${cacheHours}`);
  res.header('Access-Control-Expose-Headers', `*`);
  res.header('Access-Control-Request-Headers', `*`);
  res.header('Access-Control-Request-Method', `*`);
  next();
});

app.use('/api', userApi)
app.use(oidcProvider)

app.use('/',express.static('../client/build'))
app.use('/app',express.static('../client/build'))

app.listen(serverConfig.PORT, () => console.log(`listening on http://localhost:${serverConfig.PORT}`))
