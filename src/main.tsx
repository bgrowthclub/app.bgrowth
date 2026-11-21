import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { installTranslateGuard } from './lib/translateGuard'
import { installStaleChunkReload } from './lib/staleChunk'
import { SupabaseIdentityProvider } from './modules/identity/supabase/SupabaseIdentityProvider'
import './index.css'

// Before the first render: the browser's automatic translation rewrites
// text nodes and makes React's next DOM operation throw (see the file).
installTranslateGuard()
// A page opened before a new version went live reloads by itself (lib/staleChunk).
installStaleChunkReload()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseIdentityProvider>
        <App />
      </SupabaseIdentityProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
