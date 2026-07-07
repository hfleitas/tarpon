import { isPreviewMock } from '../rayfin/client';

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
};

export async function getExecutiveSemanticSnapshot(): Promise<ExecutiveSemanticSnapshot | null> {
  try {
    if (isPreviewMock) {
      return null;
    }
    return null;
  } catch {
    return null;
  }
}
