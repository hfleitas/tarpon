import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from './auth/AuthContext';
import { AuthGate } from './auth/AuthGate';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
);
