import React from 'react'
import { useRoutes } from 'hookrouter';
import { UsersPage } from './pages/users-page'
import { LoginPage } from './pages/login'

const routes = {
  '/': () => <LoginPage/>,
  '/app': () => <UsersPage/>,
};

const App = () => (
  <main>
    {useRoutes(routes) || <h1>Error page</h1>}
  </main>
);

export default App
