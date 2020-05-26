import React, { useState } from 'react'

const retrieveToken = () => {
  const tokenStr = localStorage.getItem('token')
  if (!tokenStr || !tokenStr.length) {
    window.location.replace('/login')
    return;
  }
  return JSON.parse(tokenStr)
}

const App = () => {
  const [token] = useState(retrieveToken())
  return (
    <main>
      <div>Hello you're in app</div>
      <p>{JSON.stringify(token)}</p>
    </main>
  )
}

export default App
