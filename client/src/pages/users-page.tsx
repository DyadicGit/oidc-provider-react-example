import React, { useEffect, useState } from "react";
import { logout, validateToken } from "../oidc-client";

export interface User {
  id: number
  name: string
  email: string,
  password: string,
}

export type UserList = User[]

const apiGetAllUsers = async (): Promise<UserList> => (await (await fetch('/api/users')).json())

validateToken(() => console.log('logout!'))

const UsersPage = () => {
  const [users, setUsers] = useState<UserList>([])
  useEffect(() => {
    apiGetAllUsers().then(setUsers)
  }, [])
  return (
    <section>
      <button type="button" onClick={logout}>Logout</button>
      <h1>Users page</h1>
      <ul>
        {users && users.map(user => (
          <li key={user.id}>
            id: {user.id},
            name: {user.name},
            email: {user.email},
            pw: {user.password}
          </li>))}
      </ul>
    </section>

  )
}
export { UsersPage }
