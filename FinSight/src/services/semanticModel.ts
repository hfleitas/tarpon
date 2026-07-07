export interface ExecutiveSemanticSnapshot {
  creditScoreAvg: number;
  amlAlertCount: number;
  highSeverityAlerts: number;
  dau: number;
  mau: number;
  mobileAdoptionPct: number;
  fxExposure: number;
  pdWeighted: number;
  lgdWeighted: number;
  source: 'semantic-model';
}

export const semanticModelBinding = {
  workspaceId:
    import.meta.env.VITE_EXECUTIVE_COMMAND_CENTER_WORKSPACE_ID ??
    '09fd4407-ad4f-42a6-92cd-c69bccd5daa1',
  datasetId:
    import.meta.env.VITE_EXECUTIVE_COMMAND_CENTER_DATASET_ID ??
    'e4d94e70-621c-402c-b997-5ea9c178b06f',
  datasetName:
    import.meta.env.VITE_EXECUTIVE_COMMAND_CENTER_DATASET_NAME ??
    'Truist Executive Command Center',
  apiBaseUrl:
    import.meta.env.VITE_POWERBI_API_BASE_URL ??
    'https://api.powerbi.com',
};

interface ExecuteQueriesResponse {
  results?: Array<{
    tables?: Array<{
      rows?: Array<Record<string, unknown>>;
    }>;
  }>;
}

const METRICS_QUERY = `
EVALUATE
ROW(
  "CreditScoreAvg", [Credit Score Avg],
  "AmlAlertCount", [AML Alert Count],
  "HighSeverityAlerts", [High Severity Alerts],
  "DAU", [DAU],
  "MAU", [MAU],
  "MobileAdoptionPct", [Mobile Adoption %],
  "FXExposure", [FX Exposure],
  "PDWeighted", [PD Weighted],
  "LGDWeighted", [LGD Weighted]
)
`;

function readNumber(row: Record<string, unknown>, key: string): number | null {
  const direct = row[key];
  const bracketed = row[`[${key}]`];
  const value = typeof direct !== 'undefined' ? direct : bracketed;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toSnapshot(row: Record<string, unknown>): ExecutiveSemanticSnapshot | null {
  const creditScoreAvg = readNumber(row, 'CreditScoreAvg');
  const amlAlertCount = readNumber(row, 'AmlAlertCount');
  const highSeverityAlerts = readNumber(row, 'HighSeverityAlerts');
  const dau = readNumber(row, 'DAU');
  const mau = readNumber(row, 'MAU');
  const mobileAdoptionPct = readNumber(row, 'MobileAdoptionPct');
  const fxExposure = readNumber(row, 'FXExposure');
  const pdWeighted = readNumber(row, 'PDWeighted');
  const lgdWeighted = readNumber(row, 'LGDWeighted');

  if (
    creditScoreAvg === null ||
    amlAlertCount === null ||
    highSeverityAlerts === null ||
    dau === null ||
    mau === null ||
    mobileAdoptionPct === null ||
    fxExposure === null ||
    pdWeighted === null ||
    lgdWeighted === null
  ) {
    return null;
  }

  return {
    creditScoreAvg,
    amlAlertCount,
    highSeverityAlerts,
    dau,
    mau,
    mobileAdoptionPct,
    fxExposure,
    pdWeighted,
    lgdWeighted,
    source: 'semantic-model',
  };
}

export async function getExecutiveSemanticSnapshot(): Promise<ExecutiveSemanticSnapshot | null> {
  const { workspaceId, datasetId, apiBaseUrl } = semanticModelBinding;
  const endpoint = `${apiBaseUrl}/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;
  const bearerToken = import.meta.env.VITE_POWERBI_BEARER_TOKEN;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify({
        queries: [{ query: METRICS_QUERY }],
        serializerSettings: { includeNulls: true },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ExecuteQueriesResponse;
    const row = payload.results?.[0]?.tables?.[0]?.rows?.[0];
    if (!row) {
      return null;
    }
    return toSnapshot(row);
  } catch {
    return null;
  }
}
