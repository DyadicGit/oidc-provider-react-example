import React, { useState } from 'react'

const App = () => {
  const [state, setState] = useState()
  return (
    <main>
      <div>Hello you're in app</div>
      <p>{JSON.stringify(state)}</p>
    </main>
  )
}

export default App
