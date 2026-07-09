# M365 Copilot Cowork with Power BI — Truist Demo Baseline Script

> **Audience:** Demo facilitator / SE  
> **Prerequisite:** Tarpon workspace Power BI report is published and the semantic model has been refreshed.  
> **Goal:** Walk through an end-to-end agentic workflow — from a natural-language KPI question, through customer-level insight generation, to a packaged multi-channel communications plan.

---

## Grounding rule (enforce throughout)

Whenever the agent starts returning raw data rows or table output in plain text instead of a rendered card, redirect it with:

> **"For any data related questions always use render-UI to show the response and save to memory."**

---

## Prompt 1 — Executive Summary KPI

```
In my Tarpon workspace Power BI report (<url_link>) tell me the Credit Score avg
from the executive summary dashboard.
```

**Expected answer:** `575.51`  
This reconciles with the Power BI report. If the value differs, verify the semantic model has been refreshed and the `Credit Score Avg` DAX measure is resolving correctly (see `README.md → KPI definitions`).

---

## Prompt 2 — Show the query

```
Show me the query you wrote to get this KPI.
```

**Expected:** The agent surfaces the DAX (or SQL / KQL) it used — something equivalent to:

```dax
Credit Score Avg = AVERAGE(CreditRiskScores[CreditScore])
```

Confirm the measure name and table match `semantic-model/truist-risk-digital-treasury.semanticmodel.json`.

---

## Prompt 3 — Bottom-3 customers by credit score

```
What are the top 3 customers with the lowest credit score?
```

**Expected:** A ranked render-UI card listing three customers, their scores, and risk tier.  
If the agent returns a plain-text table instead of a rendered UI, apply the grounding rule above.

---

## Prompt 4 — Customer profile insight for C000326

```
Generate a customer profile insight with multiple metrics or insights for C000326
that I can share with my team to build a series of communications based on findings.
```

**Expected render-UI output** (see reference screenshot below):

- **Customer:** Parker Brooks (C000326) — Retail segment, as of Jul 4, 2026  
- **Watch signal:** Master data tags this customer "Low" risk with a 99.22 digital-adoption score, yet the credit model shows a **300** score (the floor) and one account is delinquent. Financial-crime screen is clean — this is a credit/collections story, not fraud.  
- **Credit Score:** 300 (Lowest band)  
- **Prob. of Default:** 7.86% (LGD 15%)  
- **Delinquent Balance:** $84.9K (32% of deposits)  
- **Digital Adoption:** 99.22 — Highly active  
- **Accounts:** $267,984 total deposits across 3 checking accounts  
  | Account | Type | Balance | Status |
  |---|---|---|---|
  | A00020325 | Checking | $178,220.87 | Active |
  | A00010325 | Checking | $84,947.35 | **Delinquent** |
  | A00000325 | Checking | $4,816.21 | Active |
- **Digital Engagement (Jun 5 – Jul 3):** 35 total events (last active Jul 3); top actions — Transfer 8, CardControls 7, TreasuryApproval 7, BillPay 5; devices — Web 15, Mobile (remainder)  
- **Risk & Compliance:** AML alerts 0 — clean; Early-warning signals 0 — none triggered; Master risk tier — Low (conflicts with credit score); Score updated Jul 4, 2026

![Expected render-UI response for C000326](RenderUIResponse.gif)

---

## Prompt 5 — Send via Teams and email

```
Send it via Teams message and email to Amol Manocha, Rob Kerr, and Tim Arif.
Also CC their managers.
```

**Expected:** Agent composes a Teams message and an email addressed to all three recipients with their managers CC'd.

---

## Prompt 6 — Reformat email (if needed)

> *Use only if the email output is plain text without dashboard-style formatting.*

```
The email doesn't look like a dashboard UI, please reformat and CC their managers
on the email.
```

---

## Prompt 7 — Render-UI for Teams message (if needed)

> *Use only if the Teams message was sent as plain text.*

```
Use render-UI for generating the Teams message.
```

---

## Prompt 8 — Draft the four-part communications plan

The agent will typically offer:

> *"Want me to go ahead and draft the four communications next (the three customer-facing messages plus the internal risk-tier note)?"*

Respond:

```
Yes.
```

**Expected output — 4-part comms plan:**

| Comm | Audience | Channel | Theme |
|---|---|---|---|
| 1 | Parker Brooks | Email / letter | Proactive outreach — delinquency resolution offer |
| 2 | Parker Brooks | In-app / mobile push | Digital channel — action-needed nudge |
| 3 | Parker Brooks | Relationship manager call script | Retention + remediation conversation guide |
| 4 | Internal — credit/risk team | Internal note | Risk-tier conflict flag + recommended escalation |

---

## Prompt 9 — Assign and package into Word

The agent will ask:

> *"Want me to: Package these into a Word document for the team to circulate, send Comm 4 (the internal note) to your credit/risk contact now, or post the set into the Teams chat with Amol, Rob, and Tim?"*

Respond (substituting real team names):

```
Assign Comm 1 & 2 to <teammate A>, Comm 3 to <teammate B>, and Comm 4 to <teammate C>.
Package them into a Word document.
```

**Expected:** Agent creates a formatted `.docx` with all four communications, each section headed with the assignee's name and a recommended send date.

---

## ✅ End of baseline prompts

> **This concludes the baseline demo flow.**  
> From here, the facilitator may improvise follow-on questions or hand the keyboard to the audience.

---

## Reference values (reconciliation table)

| KPI | Expected value | Source measure |
|---|---|---|
| Credit Score Avg | **575.51** | `AVERAGE(CreditRiskScores[CreditScore])` |
| C000326 Credit Score | **300** (floor) | `CreditRiskScores[CreditScore]` for C000326 |
| C000326 Delinquent Balance | **$84,947.35** | Account A00010325 |
| C000326 PD | **7.86%** | `CreditRiskScores[PD]` for C000326 |
| C000326 Digital Adoption | **99.22** | `DigitalEngagement` engagement score for C000326 |

---

## Troubleshooting tips

| Symptom | Fix |
|---|---|
| Credit Score Avg ≠ 575.51 | Re-run the E2E orchestration pipeline and refresh the semantic model. |
| Agent returns raw table rows | Say: *"For any data related questions always use render-UI to show the response and save to memory."* |
| Email lacks dashboard formatting | Use Prompt 6 to request a reformatted email with dashboard UI styling. |
| Teams message is plain text | Use Prompt 7 to request render-UI for Teams. |
| Customer C000326 not found | Confirm seed data was loaded via `sample-data/00_setup_lakehouse_and_seed_data.ipynb`. |
