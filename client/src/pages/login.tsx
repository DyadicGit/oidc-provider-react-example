import React, { useEffect, useState } from 'react'
import { authenticate, provideMeCredentials } from "../oidc-client";

const LoginPage = () => {
  const [showLogin, setShowLogin] = useState(false)
  const [status, setStatus] = useState()
  const [errorMessage, setErrorMessage] = useState()
  useEffect(() => {
    authenticate().then((authResult) => {
      if (!authResult) {
        setErrorMessage('authenticate failure')
        return
      }
      const { status, message } = authResult
      if (status === 'PROVIDE_CREDENTIALS') {
        setShowLogin(true)
      }
      setStatus(status)
      setErrorMessage(message)
    })
  }, [])
  const submitLogin = (event) => {
    event.preventDefault()
    const form = new FormData(event.target).entries() as any
    const data = { login: '', password: '' }
    for (const entry of form) {
      data[entry[0]] = entry[1]
    }
    provideMeCredentials(data.login, data.password).then(authResult => {
      if (!authResult) {
        setErrorMessage('authenticate failure')
        return
      }
      const { status, message } = authResult
      setStatus(status)
      setErrorMessage(message)
    })
  }
  return (
    <section>
      <h2>{}</h2>
      {showLogin && (
        <>
          <h1>Login here</h1>
          <form onSubmit={submitLogin}>
            <div>
              <label htmlFor="email">Enter your email: </label>
              <input type="email" name="email" id="email" required/>
            </div>
            <div>
              <label htmlFor="name">Enter your password: </label>
              <input type="text" name="password" id="password" required/>
            </div>
            <div>
              <input type="submit" value="login"/>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
export { LoginPage }
