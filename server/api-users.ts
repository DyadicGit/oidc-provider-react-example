import express from 'express'
import { database } from './db'

const userApi = express()

userApi.get('/users', (req, res) => {
  res.json(database.users)
})

export { userApi }
