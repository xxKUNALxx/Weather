import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <GoogleOAuthProvider clientId="743047252451-l1s3cjv7mhdlfvvrlj8mcr3ka5sof3bu.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
