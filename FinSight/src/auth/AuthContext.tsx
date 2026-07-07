import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  client,
  isPreviewMock,
  initAuth,
  signIn as seamSignIn,
  signOut as seamSignOut,
  fabricAuthEnabled,
  type SessionUser,
} from '../rayfin/client';
import { seedIfEmptyForUser, type SeedClient } from '../rayfin/seed';
import type { AmlCase, CreditReview, DigitalInitiative, TreasuryAction } from '../rayfin/schema';

export type AuthUser = SessionUser;

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  fabricAuthEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const seedDataClient: SeedClient = {
  data: {
    AmlCase: {
      select: (fields) => client.data.AmlCase.select(fields),
      create: (row: Omit<AmlCase, 'id'> & { id?: string }) => client.data.AmlCase.create(row),
    },
    CreditReview: {
      select: (fields) => client.data.CreditReview.select(fields),
      create: (row: Omit<CreditReview, 'id'> & { id?: string }) =>
        client.data.CreditReview.create(row),
    },
    TreasuryAction: {
      select: (fields) => client.data.TreasuryAction.select(fields),
      create: (row: Omit<TreasuryAction, 'id'> & { id?: string }) =>
        client.data.TreasuryAction.create(row),
    },
    DigitalInitiative: {
      select: (fields) => client.data.DigitalInitiative.select(fields),
      create: (row: Omit<DigitalInitiative, 'id'> & { id?: string }) =>
        client.data.DigitalInitiative.create(row),
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Runs once. Preview: auto sign-in. Real (embedded in Fabric): silent SSO.
    let cancelled = false;
    void (async () => {
      try {
        const u = await initAuth();
        if (!cancelled) {
          if (u && !isPreviewMock) {
            try {
              await seedIfEmptyForUser(seedDataClient, u.id);
            } catch (error) {
              console.warn('Failed to initialize first-run dataset.', error);
            }
          }
          setUser(u);
        }
      } catch {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    const signedInUser = await seamSignIn();
    if (!isPreviewMock) {
      try {
        await seedIfEmptyForUser(seedDataClient, signedInUser.id);
      } catch (error) {
        console.warn('Failed to initialize first-run dataset.', error);
      }
    }
    setUser(signedInUser);
  }, []);

  const signOut = useCallback(async () => {
    await seamSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut, fabricAuthEnabled }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
