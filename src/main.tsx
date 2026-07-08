import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { MockIdentityProvider } from './modules/identity/mock/MockIdentityProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MockIdentityProvider>
        <App />
      </MockIdentityProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
