import express from 'express'
import { database } from './db'
import { verifyJWT } from './oidc-provider/utils'
const userApi = express()

userApi.get('/users', verifyJWT, (req, res) => {
  res.json(database.users)
})

export { userApi }
