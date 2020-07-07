let posts: Map<string, User> = new Map();

export interface User {
  id: number
  name: string
  email: string,
  password: string,
}
export type UserList = User[]

const add = (data: User) => {
  if (posts.has(data.id.toString())) {
    throw Error('already exists')
  }
  posts.set(data.id.toString(), data)
}
const remove = (id) => posts.delete(id.toString())
const set = (id, data: User) => posts.set(id.toString(), data)
const get = (id): User => posts.get(id.toString())
const all = (): UserList => Array.from(posts.values())

const init = async () => {
  const initPosts = await import('./db.json')
  posts = new Map<string, User>(initPosts.posts.map(s => [s.id.toString(), s]))
}
init()

const storage = { users: { add, get, remove, set, all }}

export default storage
