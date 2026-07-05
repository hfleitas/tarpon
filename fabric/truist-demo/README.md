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
- [`presentations/executive-summary/Executive-Summary-Truist.md`](presentations/executive-summary/Executive-Summary-Truist.md)  
  Presentation-ready narrative for the executive summary deck, with slide images, on-slide text, and speaker notes.

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

## Reports Reference (dashboard-by-dashboard)

The report experience is driven by these dashboard definitions:

| Dashboard | File | Primary KPIs / visuals |
|---|---|---|
| Executive Summary (Executive Command Center page) | `dashboards/executive-command-center.dashboard.json` | Credit Score Avg, AML Alert Count, DAU, FX Exposure, Credit and AML Trend (30 days), Liquidity by Bucket |
| Risk Overview | `dashboards/credit-risk-early-warning.dashboard.json` | PD Weighted, LGD Weighted, Credit Score Trend, Early Warning Count by Severity |
| Treasury Liquidity Overview | `dashboards/treasury-liquidity-overview.dashboard.json` | FX Exposure, Liquidity by Bucket, Currency Mix |
| AML Case Intelligence | `dashboards/aml-case-intelligence.dashboard.json` | Alerts in Last 24 Hours, High Severity Alerts, Suspicious Transaction Ratio, AML Alerts by Reason |
| Digital Engagement Insights | `dashboards/digital-engagement-insights.dashboard.json` | DAU, MAU, Mobile Adoption %, Engagement Score Trend, Event Mix by Device |

### Executive Summary narrative (presentation-ready)

- **Financial crime & AML:** **475 AML alerts** raised in the last 24 hours, with **95 classified as high severity** (shown as **High Severity Alerts - Last 24 Hours**); leading alert drivers are **Structuring (130)**, **Counterparty Concern (116)**, **Unusual Velocity (116)**, and **High-Risk Geography (113)**, indicating elevated compliance and investigative workload.
- **Suspicious activity quality:** **Suspicious Transaction Ratio is 4.88%**, suggesting a non-trivial portion of monitored activity is being flagged as suspicious and may require further review and SAR decisions.
- **Credit & portfolio risk:** Average customer **credit score is 575.51**, with **PD weighted at 3.30%** and **LGD weighted at 41.58%**, highlighting moderate credit quality and sizable loss severity if defaults materialize.
- **Early warning signals:** Early warning indicators are evenly distributed by severity with **2,667 High**, **2,667 Medium**, and **2,666 Low** risk alerts, implying a broad-based risk signal rather than being concentrated in one band.
- **Liquidity & treasury:** Liquidity is well-distributed across time buckets, with each band around **$28.2-$28.9B**, and total **FX exposure of ~$90.82B** across non-USD currencies (GBP, JPY, EUR, CAD) each around **$22-23B**, indicating large but diversified currency risk.
- **Digital engagement:** The bank has **10,000 MAU** and approximately **5,000 DAU** (4,876 in the detailed executive rollup), while **mobile adoption remains at 37.93%**; customer event volumes are broadly similar across **Mobile**, **Tablet**, and **Web** for key activities such as Login, BillPay, Transfer, CardControls, ProfileUpdate, and TreasuryApproval.

### KPI and acronym definitions

| Term | Definition | Semantic model expression / source |
|---|---|---|
| KPI | Key Performance Indicator; business metric shown as a card, trend, or target visual. | Calculated as DAX measures in `semantic-model/truist-risk-digital-treasury.semanticmodel.json` |
| AML | Anti-Money Laundering monitoring domain. | Backed by `AML_Alerts` and derived AML measures |
| DAU | Daily Active Users (distinct digital users active on latest date in context). | `DISTINCTCOUNT(DigitalEngagement[CustomerID])` filtered to current date |
| MAU | Monthly Active Users (distinct users over trailing 30 days). | `DATESINPERIOD(..., -30, DAY)` over `DigitalEngagement[Timestamp]` |
| FX | Foreign Exchange exposure (non-USD absolute treasury amount). | `SUMX(FILTER(TreasuryPositions, Currency <> "USD"), ABS(Amount))` |
| PD | Probability of Default, balance-weighted across customers. | `PD Weighted` measure over `CreditRiskScores[PD]` and `Accounts[Balance]` |
| LGD | Loss Given Default, balance-weighted expected loss severity. | `LGD Weighted` measure over `CreditRiskScores[LGD]` and `Accounts[Balance]` |
| Early Warning Count | Count of generated risk deterioration warning rows. | `COUNTROWS(EarlyWarningSignals)` |
| High Severity Alerts | AML alerts with `RiskScore >= 80`. | `CALCULATE(COUNTROWS(AMLAlerts), AMLAlerts[RiskScore] >= 80)` |
| Suspicious Transaction Ratio | AML alert volume relative to distinct transaction volume. | `DIVIDE([AML Alert Count], DISTINCTCOUNT(Transactions[TxID]), 0)` |
| Mobile Adoption % | Share of active users seen on mobile device. | Distinct mobile users / distinct digital users |
| Engagement Score | Weighted digital event intensity per customer. | Weighted event sum (`Login`, `BillPay`, `Transfer`, `TreasuryApproval`, etc.) / distinct users |
| Liquidity Bucket | Treasury maturity buckets used in liquidity visuals (`0-7D`, `8-30D`, `31-90D`, `90D+`). | `TreasuryPositions[LiquidityBucket]` with amount aggregation |

### How dashboard data is populated (bootstrap + refresh/regeneration)

1. **Bootstrap Lakehouse tables**  
   Run `sample-data/00_setup_lakehouse_and_seed_data.ipynb` to create baseline Delta tables (`Retail_*`, `Commercial_*`, `Risk_*`, `AML_*`, `Digital_*`).
2. **Generate synthetic ingestion files**  
   Run `sample-data/generate_ingestion_files.py` to write source files under `Files/Ingestion/...`:
   - retail transactions CSV
   - treasury positions CSV
   - AML alerts JSON
   - digital engagement logs JSON
3. **Run ingestion pipelines**  
   Trigger `pipelines/truist-e2e-orchestration.pipeline.json`, which executes:
   - `pl_retail_transactions_daily`
   - `pl_treasury_positions_csv`
   - `pl_aml_alerts_json`
   - `pl_digital_engagement_append`
4. **Run transformation notebooks (via orchestration)**  
   The same orchestration invokes:
   - `01_credit_deterioration_signals`
   - `02_customer_risk_tiers`  
   Pipeline-specific notebooks also refresh AML and digital KPI derivatives:
   - `03_aml_anomaly_detection`
   - `04_digital_engagement_kpis`
5. **Model + report refresh**  
   The Direct Lake semantic model (`TruistRiskDigitalTreasury`) reads updated Lakehouse tables and powers all dashboard pages.

### To generate *more* data and force visible KPI movement

1. Increase row volumes in `sample-data/generate_ingestion_files.py` (`n_transactions`, `n_positions`, `n_alerts`, `n_events`).
2. Optionally skew distributions (for example, raise AML `RiskScore`, change digital `Device` split, or shift treasury `Currency`/`LiquidityBucket` mix).
3. Regenerate source files, rerun `pl_truist_e2e_orchestration`, then refresh the semantic model/report to reflect the new visual state.

### Presentation package

For a presenter-friendly walkthrough of the executive summary, use:

- [`presentations/executive-summary/Executive-Summary-Truist.md`](presentations/executive-summary/Executive-Summary-Truist.md)

That package mirrors the deck slide-by-slide and includes the exported slide images under `presentations/executive-summary/slides/`.

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
