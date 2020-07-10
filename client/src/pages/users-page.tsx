import React, { useEffect, useState } from "react";
import { logout, storage, validateToken } from "../oidc-client";

interface User {
  id: number
  name: string
  email: string,
  password: string,
}

type UserList = User[]


const authHeader = { headers: { 'Authorization': `Bearer ${btoa((storage.retrieveToken() || {access_token: 'empty'}).access_token)}` } }

const apiGetAllUsers = async (): Promise<UserList> => (await (await fetch('/api/users', authHeader)).json())

const redirectToLogin = () => {
  if (window.location.pathname !== '/' && window.confirm('you are being logged-out!')) {
    window.location.href = '/'
  }
}
validateToken(redirectToLogin)

const logoutAndRedirect = () => logout().then(redirectToLogin)

const UsersPage = () => {
  const [users, setUsers] = useState<UserList>([])
  useEffect(() => {
    apiGetAllUsers().then(setUsers)
  }, [])
  return (
    <section>
      <button type="button" onClick={logoutAndRedirect}>Logout</button>
      <button type="button" onClick={logout}>Revoke tokens</button>
      <span> - after revoking tokens refresh to see what happens</span>

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
