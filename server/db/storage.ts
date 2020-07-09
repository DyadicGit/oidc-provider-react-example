let userDatabase: Map<string, User> = new Map();

export interface User {
  id: number
  name: string
  email: string,
  password: string,
}
export type UserList = User[]

const add = (data: User) => {
  if (userDatabase.has(data.id.toString())) {
    throw Error('already exists')
  }
  userDatabase.set(data.id.toString(), data)
}
const remove = (id) => userDatabase.delete(id.toString())
const set = (id, data: User) => userDatabase.set(id.toString(), data)
const get = (id): User => userDatabase.get(id.toString())
const all = (): UserList => Array.from(userDatabase.values())

const init = async () => {
  const initPosts = await import('./db.json')
  userDatabase = new Map<string, User>(initPosts.users.map(s => [s.id.toString(), s]))
}
init()

const storage = { users: { add, get, remove, set, all }}

export default storage
