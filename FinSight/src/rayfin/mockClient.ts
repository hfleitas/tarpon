// ─────────────────────────────────────────────────────────────────────────────
// Mock RayfinClient — an OFFLINE, in-memory stand-in for @microsoft/rayfin-client.
//
// Why this exists: OpenLove's live preview runs in a browser sandbox
// (WebContainer) that cannot open the raw SQL/TCP connection or complete the
// Entra sign-in a real Fabric backend needs. So in preview we swap the real
// client for this mock, which implements the SAME surface
// (`client.data.<Entity>.select().orderBy().execute()/create/update/findById/delete`
// and `client.auth.*`). Because the shape matches, your app code does not change
// when you deploy for real — see README "Going live".
//
// It keeps rows in memory (like the official template's own local fallback), so
// data resets on reload. That is intentional for a preview.
// ─────────────────────────────────────────────────────────────────────────────

export interface MockSession {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string } | null;
}

type Ordering<T> = Partial<Record<keyof T, 'asc' | 'desc'>>;

function compare(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

/** Fluent SELECT builder mirroring the real client's `.select().orderBy().execute()`. */
class SelectBuilder<T extends { id: string }> {
  private ordering?: Ordering<T>;
  constructor(
    private readonly getRows: () => T[],
    private readonly fields?: (keyof T)[],
  ) {}

  orderBy(ordering: Ordering<T>): this {
    this.ordering = ordering;
    return this;
  }

  async execute(): Promise<T[]> {
    let rows = [...this.getRows()];
    if (this.ordering) {
      const entry = Object.entries(this.ordering)[0] as [keyof T, 'asc' | 'desc'] | undefined;
      if (entry) {
        const [key, dir] = entry;
        rows.sort((a, b) => compare(a[key], b[key]) * (dir === 'desc' ? -1 : 1));
      }
    }
    if (this.fields && this.fields.length > 0) {
      rows = rows.map((row) => {
        const projected = {} as T;
        for (const f of this.fields!) projected[f] = row[f];
        return projected;
      });
    }
    return rows;
  }
}

/** Per-entity CRUD, mirroring `client.data.<Entity>`. */
class MockEntity<T extends { id: string }> {
  private rows: T[] = [];

  select(fields?: (keyof T)[]): SelectBuilder<T> {
    return new SelectBuilder<T>(() => this.rows, fields);
  }

  async create(data: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const row = { ...(data as object), id: data.id ?? crypto.randomUUID() } as T;
    this.rows.push(row);
    return row;
  }

  async update(where: { id: string }, updates: Partial<T>): Promise<void> {
    const row = this.rows.find((r) => r.id === where.id);
    if (row) Object.assign(row, updates);
  }

  async findById(id: string): Promise<T | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async delete(where: { id: string }): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== where.id);
  }
}

export interface MockRayfinClient<S extends Record<string, { id: string }>> {
  data: { [K in keyof S]: MockEntity<S[K]> };
  auth: {
    signIn(creds?: { email: string; password: string }): Promise<void>;
    signUp(creds: { email: string; password: string }): Promise<void>;
    signOut(): Promise<void>;
    getSession(): MockSession;
  };
}

export function createMockRayfinClient<
  S extends Record<string, { id: string }>,
>(): MockRayfinClient<S> {
  const entities = new Map<string, MockEntity<{ id: string }>>();

  const data = new Proxy(
    {},
    {
      get(_target, prop: string | symbol) {
        const name = typeof prop === 'string' ? prop : prop.toString();
        if (!entities.has(name)) entities.set(name, new MockEntity());
        return entities.get(name);
      },
    },
  ) as MockRayfinClient<S>['data'];

  let session: MockSession = { isAuthenticated: false, user: null };
  const auth: MockRayfinClient<S>['auth'] = {
    async signIn(creds) {
      const email = creds?.email ?? 'dev@local';
      session = {
        isAuthenticated: true,
        user: { id: 'local-user', email, name: email.split('@')[0] },
      };
    },
    async signUp(creds) {
      await auth.signIn(creds);
    },
    async signOut() {
      session = { isAuthenticated: false, user: null };
    },
    getSession() {
      return session;
    },
  };

  return { data, auth };
}
