import { RayfinClient } from '@microsoft/rayfin-client';
import {
  bridgeFabricCallback,
  ensureSignedInWithFabric,
  initEmbeddedAuth,
  type FabricAuthOptions,
} from '@microsoft/rayfin-auth-provider-fabric';

import { createMockRayfinClient } from './mockClient';
import { seedMock } from './seed';
import type { FinSightAppSchema } from './schema';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const rayfinApiUrl = import.meta.env.VITE_RAYFIN_API_URL;
const rayfinPublishableKey = import.meta.env.VITE_RAYFIN_PUBLISHABLE_KEY;
const fabricItemId = import.meta.env.VITE_FABRIC_ITEM_ID;
const fabricWorkspaceId = import.meta.env.VITE_FABRIC_WORKSPACE_ID;
const fabricPortalUrl = import.meta.env.VITE_FABRIC_PORTAL_URL;
const forcePreviewMock = import.meta.env.VITE_RAYFIN_USE_MOCK === 'true';

const hasFabricRuntimeConfig = Boolean(
  rayfinApiUrl &&
    rayfinPublishableKey &&
    fabricItemId &&
    fabricWorkspaceId &&
    fabricPortalUrl,
);

export const isPreviewMock = forcePreviewMock || !hasFabricRuntimeConfig;
export const fabricAuthEnabled = !isPreviewMock;

const realClient = isPreviewMock
  ? null
  : new RayfinClient<FinSightAppSchema>({
      baseUrl: rayfinApiUrl,
      publishableKey: rayfinPublishableKey,
      useProxy: false,
      authStorage: true,
    });

const mockClient = createMockRayfinClient<FinSightAppSchema>();

if (isPreviewMock) {
  seedMock(mockClient);
}

if (!isPreviewMock) {
  bridgeFabricCallback();
}

/** Data access — client.data.<Entity>.select/create/update/findById/delete. */
export const client = realClient ?? mockClient;

function getRealClient(): RayfinClient<FinSightAppSchema> {
  if (!realClient) {
    throw new Error('Rayfin client is not configured for this runtime.');
  }

  return realClient;
}

function isFabricEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function getFabricAuthOptions(): FabricAuthOptions {
  if (!fabricAuthEnabled) {
    throw new Error('Fabric auth is not enabled for the current runtime.');
  }

  return {
    workspaceId: fabricWorkspaceId,
    projectId: fabricItemId,
    fabricPortalUrl,
    returnOrigin: window.location.origin,
    fabricEmbedded: isFabricEmbedded(),
  };
}

function toDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? 'user';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function toSessionUser(
  user: { id: string; email: string; name?: string } | null | undefined,
): SessionUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name?.trim() || toDisplayName(user.email),
  };
}

const PREVIEW_USER: SessionUser = {
  id: 'local-user',
  email: 'analyst@truist.demo',
  name: 'Risk Analyst',
};
let currentUser: SessionUser | null = null;

export async function initAuth(): Promise<SessionUser | null> {
  if (isPreviewMock) {
    await mockClient.auth.signIn({ email: PREVIEW_USER.email, password: 'preview' });
    currentUser = PREVIEW_USER;
    return currentUser;
  }

  const sdkClient = getRealClient();
  const embeddedSession = await initEmbeddedAuth(sdkClient.auth, getFabricAuthOptions());
  if (embeddedSession?.user) {
    currentUser = toSessionUser(embeddedSession.user);
    return currentUser;
  }

  const existingSession = sdkClient.auth.getSession();
  if (existingSession.isAuthenticated && existingSession.user) {
    currentUser = toSessionUser(existingSession.user);
    return currentUser;
  }

  if (sdkClient.auth.hasRefreshToken()) {
    await sdkClient.auth.refreshSession();
    const refreshedSession = sdkClient.auth.getSession();
    currentUser = toSessionUser(refreshedSession.user);
    return currentUser;
  }

  currentUser = null;
  return currentUser;
}

export async function signIn(): Promise<SessionUser> {
  if (isPreviewMock) {
    await mockClient.auth.signIn({ email: PREVIEW_USER.email, password: 'preview' });
    currentUser = PREVIEW_USER;
    return currentUser;
  }

  const session = await ensureSignedInWithFabric(
    getRealClient().auth,
    getFabricAuthOptions(),
  );
  currentUser = toSessionUser(session.user);
  if (!currentUser) {
    throw new Error('Fabric sign-in completed without a user session.');
  }

  return currentUser;
}

export async function signOut(): Promise<void> {
  if (!isPreviewMock) {
    await getRealClient().auth.signOut();
  }
  currentUser = null;
}

export function getCurrentUser(): SessionUser | null {
  if (!isPreviewMock) {
    return toSessionUser(getRealClient().auth.getSession().user) ?? currentUser;
  }

  return currentUser;
}
