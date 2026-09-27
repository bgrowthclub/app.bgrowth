import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SupabaseIdentityProvider } from './modules/identity/supabase/SupabaseIdentityProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseIdentityProvider>
        <App />
      </SupabaseIdentityProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
