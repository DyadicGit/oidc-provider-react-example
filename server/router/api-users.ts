import express, { json } from 'express'
import storage from '../db/storage'
const userApi = express()

userApi.get('/users', (req, res) => {
  res.json(storage.users.all())
})

userApi.get('/users/:id', (req, res) => {
  res.json(storage.users.get(decodeURIComponent(req.params.id)))
})

userApi.delete('/users/:id', (req, res) => {
  res.send(storage.users.remove(decodeURIComponent(req.params.id)))
})

userApi.post('/users', json(), (req, res) => {
  const user = req.body
  try {
    storage.users.add(user)
    res.json(storage.users.get(user.id))
  } catch (e) {
    res.send('ALREADY EXISTS')
  }
})

userApi.patch('/users/:id', json(), (req, res) => {
  const { body } = req
  delete body.id

  const existing = storage.users.get(decodeURIComponent(req.params.id))
  if (!existing) return res.send('NO ENTRY')

  const modified
    = Object.getOwnPropertyNames(existing)
    .reduce(
      (acc, attr) => ({ ...acc, [attr]: body[attr] || existing[attr] }),
      existing)

  storage.users.set(existing.id, modified)

  res.json(modified)
})

export { userApi }
