import { useState, type ReactNode } from 'react';

import { useAuth } from './AuthContext';

/**
 * Gates the app behind Fabric sign-in when it runs as a STANDALONE deployment.
 *
 * Three run modes, one component:
 *  - Preview (in-memory mock): auth is disabled and `initAuth()` auto-signs-in,
 *    so the gate passes straight through — the app runs instantly in OpenLove.
 *  - Embedded in the Fabric portal: `initAuth()` gets a silent SSO session, so
 *    `user` is set and the gate passes through with no sign-in screen.
 *  - Standalone public URL (e.g. https://…​.webapp.fabricapps.net): there is NO
 *    ambient Fabric session, so we show a "Sign in with Microsoft" screen that
 *    runs the interactive brokered flow. WITHOUT this gate, the app renders
 *    unauthenticated and every data write hits the backend with no token → 401.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, signIn, fabricAuthEnabled } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Still resolving the initial session (silent SSO / mock auto sign-in).
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ height: 24, width: 24, borderRadius: '50%', border: '2px solid #cbd5e1', borderTopColor: '#4f46e5', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  // Authenticated, or preview mock where auth is disabled → show the app.
  if (user || !fabricAuthEnabled) return <>{children}</>;

  const onSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signIn();
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 384, borderRadius: 20, border: '1px solid #e4e4e7', background: '#ffffff', padding: 32, textAlign: 'center', boxShadow: '0 4px 24px -8px rgba(24,24,27,0.12)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#18181b' }}>Sign in</h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#71717a' }}>
          Sign in with your Microsoft account to continue.
        </p>
        <button
          onClick={() => void onSignIn()}
          disabled={signingIn}
          style={{ marginTop: 24, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, background: '#4f46e5', padding: '12px 20px', fontWeight: 500, color: '#ffffff', border: 'none', cursor: signingIn ? 'not-allowed' : 'pointer', opacity: signingIn ? 0.6 : 1, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', transition: 'background 0.15s' }}
          onMouseEnter={(e) => { if (!signingIn) e.currentTarget.style.background = '#4338ca'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#4f46e5'; }}
        >
          <MicrosoftLogo />
          {signingIn ? 'Signing in…' : 'Sign in with Microsoft'}
        </button>
        {error && <p style={{ marginTop: 12, fontSize: '0.875rem', color: '#e11d48' }}>{error}</p>}
      </div>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="0" y="0" width="7" height="7" fill="#F25022" />
      <rect x="9" y="0" width="7" height="7" fill="#7FBA00" />
      <rect x="0" y="9" width="7" height="7" fill="#00A4EF" />
      <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
    </svg>
  );
}
