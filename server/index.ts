import express from 'express'
import { userApi } from "./router/api-users";
import environment from './environment'
import { oidcProvider } from "./oidc-provider";
const app = express()

// Cors
const cacheHours = 24 * 60 * 60; // 24 hours
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Max-Age', `${cacheHours}`);
  next();
});

app.get('/', (req, res) => res.send('ok'))
app.use('/api', userApi)
app.use(oidcProvider)

app.listen(environment.PORT, () => console.log(`listening on http://localhost:${environment.PORT}`))
