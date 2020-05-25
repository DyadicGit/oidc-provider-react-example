import React, { useState } from 'react'

const loginWithRefresh = 'http://localhost:3000/oidc/auth?client_id=test_app&response_type=code&scope=openid%20email%20offline_access&prompt=consent&redirect_uri=http://localhost:3000/callback'

const App = () => {
  const [uid, setUid] = useState()
  const authenticate = async () => {
    try {
      const response = await fetch(loginWithRefresh)
      const data = await response.json()
      console.log(data)
      if (data.uid) {
        setUid(data.uid)
        sessionStorage.setItem('uid', data.uid)
      } else {
        localStorage.setItem('token', JSON.stringify(data))
      }
    } catch (e) {
      console.log(e)
    }
  }
  const handleSubmit = e => {
    e.preventDefault()
    fetch(`http://localhost:3000/my/${uid}/login`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'admin', password: 'admin' }) }).then(
      r => {
        console.log(r)
        r.json().then(data => {
          console.log(data)
        })
      }
    )
  }
  return (
    <main>
      <div>Login page</div>
      <button type="button" onClick={authenticate}>
        authenticate
      </button>
      <form autoComplete="off" autoFocus="on" onSubmit={handleSubmit}>
        <input required type="text" name="login" placeholder="Enter any login" />
        <input required type="password" name="password" placeholder="and password" />
        <button type="submit">Sign-in</button>
      </form>
    </main>
  )
}

export default App
