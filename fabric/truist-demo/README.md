# Truist Fabric Demo Assets

This bundle contains runnable Microsoft Fabric assets for a demo focused on:

- risk discipline
- digital efficiency
- treasury modernization
- AML automation

## Asset Map

- `sample-data/00_setup_lakehouse_and_seed_data.ipynb`  
  Creates Lakehouse folders/tables and seeds synthetic Delta data (10k customers, 100k transactions, etc.).
- `sample-data/generate_ingestion_files.py`  
  Generates synthetic CSV/JSON/log source files for pipeline ingestion.
- `notebooks/01_credit_deterioration_signals.ipynb`  
  Calculates daily credit deterioration signals.
- `notebooks/02_customer_risk_tiers.ipynb`  
  Generates customer risk tiers from risk + AML + digital features.
- `notebooks/03_aml_anomaly_detection.ipynb`  
  Detects AML anomalies using business rules and z-score outlier logic.
- `notebooks/04_digital_engagement_kpis.ipynb`  
  Builds DAU, MAU, login frequency, and mobile-vs-web KPIs.
- `pipelines/*.pipeline.json`  
  Fabric pipeline definitions for retail transactions, treasury CSV, AML JSON, digital logs, and orchestration.
- `kql/truistsignals.kql`  
  Eventhouse/KQL database setup script (tables, streaming ingestion policy, and mappings).
- `kql/truistsignals.sample-queries.kql`  
  Sample KQL analytics queries (fraud, watchlist, funnel) plus Copilot prompt references.
- `deployment/setup-workspace.ps1`  
  Workspace setup automation step that applies the KQL setup section from `kql/truistsignals.kql` to the target KQL database.
- `semantic-model/truist-risk-digital-treasury.semanticmodel.json`  
  Semantic model definition with required measures.
- `dashboards/*.dashboard.json`  
  JSON visual definitions for four domain dashboards plus a multi-page executive command center (`dashboards/executive-command-center.dashboard.json`).

## Lakehouse Folder/Table Layout

The setup notebook materializes these Delta paths and tables:

- `/Retail/Customers` -> `Retail_Customers`
- `/Retail/Accounts` -> `Retail_Accounts`
- `/Retail/Transactions` -> `Retail_Transactions`
- `/Commercial/Clients` -> `Commercial_Clients`
- `/Commercial/TreasuryPositions` -> `Commercial_TreasuryPositions`
- `/Risk/CreditRiskScores` -> `Risk_CreditRiskScores`
- `/Risk/EarlyWarningSignals` -> `Risk_EarlyWarningSignals`
- `/AML/Alerts` -> `AML_Alerts`
- `/AML/CaseEvents` -> `AML_CaseEvents`
- `/Digital/EngagementEvents` -> `Digital_EngagementEvents`

## Copilot Semantic Model Prompt Examples

Use these in Fabric Copilot / Power BI Copilot:

1. `Explain why Customer 123 moved into high-risk tier.`
2. `Summarize AML alerts for the last 24 hours.`
3. `Describe liquidity changes across buckets.`
4. `Generate a client-ready narrative for digital engagement trends.`

## Workspace Setup Automation (includes Eventhouse/KQL bootstrap)

Run this after authenticating with `az login` to apply the KQL tables + ingestion mappings as part of workspace setup:

```powershell
.\fabric\truist-demo\deployment\setup-workspace.ps1 `
  -WorkspaceId "09fd4407-ad4f-42a6-92cd-c69bccd5daa1" `
  -KqlDatabaseDisplayName "TruistSignalsHost"
```

Notes:
- The script executes the setup sections of `kql/truistsignals.kql` (table creation, streaming-ingestion policy, JSON mappings).
- It targets the KQL database name resolved from Fabric metadata for the provided workspace and display name.
