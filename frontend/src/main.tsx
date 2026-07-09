import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// ─── Google OAuth Client ID ──────────────────────────────────────────────────
// Set VITE_GOOGLE_CLIENT_ID in your .env file:
//   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
//
// Without this value the Google Sign-In button will still render but clicking it
// will show a Google error ("The OAuth client was not found").
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
