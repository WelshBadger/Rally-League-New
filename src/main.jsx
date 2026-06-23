import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#222',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
