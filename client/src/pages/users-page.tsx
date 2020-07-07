import React, { useEffect, useState } from "react";

export interface User {
  id: number
  name: string
  email: string,
  password: string,
}

export type UserList = User[]

const apiGetAllUsers = async (): Promise<UserList> => (await (await fetch('http://localhost:3000/api/users')).json())

const UsersPage = () => {
  const [users, setUsers] = useState<UserList>([])
  useEffect(() => {
    apiGetAllUsers().then(setUsers)
  }, [])
  return (
    <main>
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
    </main>

  )
}
export { UsersPage }
