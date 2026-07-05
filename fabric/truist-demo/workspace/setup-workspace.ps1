<#
.SYNOPSIS
    Creates workspace folders and moves all Fabric items into their designated folders
    for the Tarpon / Truist Demo workspace.

.DESCRIPTION
    Workspace : Tarpon
    Workspace ID : 09fd4407-ad4f-42a6-92cd-c69bccd5daa1
    Tenant ID    : 72f988bf-86f1-41af-91ab-2d7cd011db47
    Region       : West Central US

    Folder structure
    ────────────────
    Foundation       – Core persistent storage (Lakehouse, Eventhouse)
    Ingestion        – Raw data sourcing (Notebooks, DataPipeline)
    Transform        – Cleansing & feature engineering (Dataflows, Notebooks)
    Semantic Layer   – Governed BI model (SemanticModel)
    Reports          – Published dashboards (Report)
    QA and Testing   – Smoke / write tests, best-practice analyser (Notebooks)
    Dataflow Staging – Auto-generated Dataflow Gen2 staging artifacts

    API note
    ────────
    The correct body field for the Fabric move endpoint is "targetFolderId"
    (NOT "destinationFolderId"). The wrong field name is silently ignored and
    the item stays at root — confirmed via live testing July 2026.

.PREREQUISITES
    az login --tenant 72f988bf-86f1-41af-91ab-2d7cd011db47

.USAGE
    .\setup-workspace.ps1
    .\setup-workspace.ps1 -WhatIf        # dry-run: prints moves without executing
#>

param(
    [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Config ────────────────────────────────────────────────────────────────────
$WorkspaceId = '09fd4407-ad4f-42a6-92cd-c69bccd5daa1'
$ApiBase     = 'https://api.fabric.microsoft.com'
$Resource    = $ApiBase

# ── Auth ──────────────────────────────────────────────────────────────────────
Write-Host "`n🔐 Acquiring Fabric API token..." -ForegroundColor Cyan
$Token   = az account get-access-token --resource $Resource --query accessToken -o tsv
$Headers = @{ Authorization = "Bearer $Token"; 'Content-Type' = 'application/json' }

# ── Folder definitions ────────────────────────────────────────────────────────
$FolderDefs = @(
    'Foundation',
    'Ingestion',
    'Transform',
    'Semantic Layer',
    'Reports',
    'QA and Testing',
    'Dataflow Staging'
)

# ── Step 1 – Create folders (idempotent: skip if already present) ─────────────
Write-Host "`n📁 Creating folders..." -ForegroundColor Cyan

$ExistingFolders = (Invoke-RestMethod -Method GET `
    -Uri "$ApiBase/v1/workspaces/$WorkspaceId/folders" `
    -Headers $Headers).value

$FolderMap = @{}   # displayName → id

foreach ($f in $ExistingFolders) {
    $FolderMap[$f.displayName] = $f.id
}

foreach ($name in $FolderDefs) {
    if ($FolderMap.ContainsKey($name)) {
        Write-Host "  ⏭️  '$name' already exists ($($FolderMap[$name]))"
        continue
    }
    if ($WhatIf) {
        Write-Host "  [WhatIf] Would create folder: $name"
        continue
    }
    $body = "{`"displayName`": `"$name`"}"
    $r    = Invoke-RestMethod -Method POST `
                -Uri "$ApiBase/v1/workspaces/$WorkspaceId/folders" `
                -Headers $Headers -Body $body
    $FolderMap[$name] = $r.id
    Write-Host "  ✅ Created '$name' → $($r.id)"
}

# ── Step 2 – Item → Folder mapping ───────────────────────────────────────────
# Format: @{ itemId = 'folder display name' }
# Child items (SQLEndpoint, KQLDatabase) auto-follow their parent — skip them.
$ItemFolderMap = [ordered]@{
    # Foundation
    '5204c68f-07c2-4b01-8cd1-8b340ed5547c' = 'Foundation'      # TruistDemoLakehouse (Lakehouse)
    '1cd10407-35ce-4ade-8b7a-ced54166863f' = 'Foundation'      # TruistSignalsHost (Eventhouse)

    # Ingestion
    'd2fb30f5-5bb8-4003-ac82-8c1f6bab1f16' = 'Ingestion'       # 00_setup_lakehouse_and_seed_data
    '99b2e03c-ed59-4e81-8da9-ba547c5069a5' = 'Ingestion'       # 05_generate_ingestion_files
    '592a15ad-f856-45e5-9b82-7c0a767e654f' = 'Ingestion'       # ingest_retail_transactions
    '61366e02-aecc-437a-bc60-deb7e15c0d21' = 'Ingestion'       # ingest_treasury_positions
    'e4fdd30d-8f99-4a5f-8141-ec51e200d3df' = 'Ingestion'       # pl_aml_alerts_json (DataPipeline)

    # Transform
    '30f35739-9a4a-469e-8bbe-6d34f2e3714d' = 'Transform'       # df_retail_transactions_standardize
    '683e1c46-b77c-4f9a-8953-ad1adc6cfa5b' = 'Transform'       # df_treasury_positions_conform
    '397f1087-609b-46e1-929c-bf735a11c4b0' = 'Transform'       # df_aml_alerts_normalize
    '7f168cef-cb44-4846-b7f7-0ed5aa7f2501' = 'Transform'       # df_digital_engagement_clean
    'ff90efec-af0d-4903-9815-a5294a03cc47' = 'Transform'       # 01_credit_deterioration_signals
    'c1f4ed74-f3cf-40ce-91eb-e71672a7153f' = 'Transform'       # 02_customer_risk_tiers
    '81644a09-4bf5-47ba-b594-84402b6c5884' = 'Transform'       # 03_aml_anomaly_detection
    '08061cae-3af1-4aae-ab20-d79816f5b5ce' = 'Transform'       # 04_digital_engagement_kpis

    # Semantic Layer
    'e4d94e70-621c-402c-b997-5ea9c178b06f' = 'Semantic Layer'  # Truist Executive Command Center (SemanticModel)

    # Reports
    'f5fa5b74-e1a4-48a1-917f-6f15fae44942' = 'Reports'         # Executive Summary (Report)

    # QA and Testing
    '225cbba8-3cea-42ce-90a0-e10acf94e46c' = 'QA and Testing'  # zz_smoke_test
    'f64d4b78-fd91-438c-960e-82b7b0541b41' = 'QA and Testing'  # zz_table_write_test
    'f5adddcb-c2a2-4300-80a2-bb0577b71343' = 'QA and Testing'  # zz_table_write_test_schema
    '2d665680-54a8-45fd-b513-1334718d1719' = 'QA and Testing'  # zz_file_write_test
    'e2923a44-d3e2-410b-8f8b-9b5f9348d37c' = 'QA and Testing'  # ECC_best_practice_analyzer

    # Dataflow Staging
    '04ef6624-6dd3-4158-81e7-e4a125bdf104' = 'Dataflow Staging' # StagingWarehouseForDataflows_20260704152201
    'd0f79e73-4994-446e-a46a-980953847bb5' = 'Dataflow Staging' # StagingWarehouseForDataflows_20260704152214
    'd9205a51-fed3-47ed-8b77-741b29299726' = 'Dataflow Staging' # StagingLakehouseForDataflows_20260704152201
    'd4c7ef6d-01c7-46a4-89ee-b2116f9d7dd5' = 'Dataflow Staging' # StagingLakehouseForDataflows_20260704152214
}

# ── Step 3 – Move items ───────────────────────────────────────────────────────
Write-Host "`n🚚 Moving items into folders..." -ForegroundColor Cyan

$Success = 0; $Skipped = 0; $Failed = 0

foreach ($entry in $ItemFolderMap.GetEnumerator()) {
    $itemId     = $entry.Key
    $folderName = $entry.Value
    $folderId   = $FolderMap[$folderName]

    if (-not $folderId) {
        Write-Warning "  Folder '$folderName' not found in map — skipping item $itemId"
        $Skipped++
        continue
    }

    if ($WhatIf) {
        Write-Host "  [WhatIf] Would move $itemId → $folderName"
        continue
    }

    try {
        $body = "{`"targetFolderId`": `"$folderId`"}"
        $r    = Invoke-RestMethod -Method POST `
                    -Uri "$ApiBase/v1/workspaces/$WorkspaceId/items/$itemId/move" `
                    -Headers $Headers -Body $body
        $confirmed = $r.value[0].folderId -eq $folderId
        if ($confirmed) {
            Write-Host "  ✅ $itemId → $folderName"
            $Success++
        } else {
            Write-Warning "  ⚠️  $itemId → unexpected folderId in response"
            $Failed++
        }
    } catch {
        Write-Warning "  ❌ $itemId — $_"
        $Failed++
    }
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n────────────────────────────────────" -ForegroundColor Cyan
Write-Host "✅ Moved   : $Success" -ForegroundColor Green
Write-Host "⏭️  Skipped : $Skipped" -ForegroundColor Yellow
Write-Host "❌ Failed  : $Failed"  -ForegroundColor $(if ($Failed -gt 0) { 'Red' } else { 'Green' })
Write-Host "────────────────────────────────────`n" -ForegroundColor Cyan
