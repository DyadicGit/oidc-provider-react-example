import React, { useEffect, useState } from "react";
import { logout, storage, validateToken } from "../oidc-client";

interface User {
  id: number
  name: string
  email: string,
  password: string,
}

type UserList = User[]

const headerFallback = { access_token: 'empty' };

const authHeader = { headers: { 'Authorization': `Bearer ${btoa((storage.retrieveToken() || headerFallback).access_token)}` } }

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
      <h1>Users page</h1>
      <button type="button" onClick={logoutAndRedirect}>Logout</button>
      <button type="button" onClick={logout}>Revoke tokens</button>
      <span style={{ color: "grey" }}> - after revoking tokens refresh to see what happens OR wait an hour. &emsp; P.S. you can restart the back-end to revoke all tokens in the system.</span>

      <h3>Super secret content</h3>
      <table>
        <thead>
        <tr>
          <th>id</th><th>name</th><th>email</th><th>password</th>
        </tr>
        </thead>
        <tbody>
        {users && users.map((user, i) => (
          <tr key={i}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.password}</td>
          </tr>
        ))}
        </tbody>
      </table>
    </section>

  )
}
export { UsersPage }
