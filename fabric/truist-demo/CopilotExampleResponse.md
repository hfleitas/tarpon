Here are answers to all four prompts, run against the **Executive Summary** report [Executive Summary](context:powerbi?artifactId=f5fa5b74-e1a4-48a1-917f-6f15fae44942&artifactType=report&name=Executive%20Summary&url=https%3A%2F%2Fmsit.powerbi.com%2Fgroups%2F09fd4407-ad4f-42a6-92cd-c69bccd5daa1%2Freports%2Ff5fa5b74-e1a4-48a1-917f-6f15fae44942) and its **Truist Executive Command Center** model [Truist Executive Command Center](context:powerbi?artifactId=e4d94e70-621c-402c-b997-5ea9c178b06f&artifactType=dataset&name=Truist%20Executive%20Command%20Center&url=https%3A%2F%2Fmsit.powerbi.com%2Fdatahub%2Fdatasets%2Fe4d94e70-621c-402c-b997-5ea9c178b06f). Data is current through **Jul 4, 2026 3:59 PM** (the latest refresh), so "last 24 hours" is measured against that point.

<img width="1312" height="793" alt="image" src="https://github.com/user-attachments/assets/3ab22b4f-36da-4934-8280-692ff7865f55" />

<img width="1131" height="902" alt="image" src="https://github.com/user-attachments/assets/7744e684-89de-474b-ba47-9e6c5f7feb94" />

<img width="1122" height="918" alt="image" src="https://github.com/user-attachments/assets/c7c4a128-4009-45be-9a0c-68fd62ce3b4c" />

<img width="1150" height="932" alt="image" src="https://github.com/user-attachments/assets/57e3fefe-c96b-45d1-8cef-56b303655d8c" />

## 1. Why a customer moved into the high-risk tier
A quick caveat: the model holds only a *current* `RiskTier` per customer — there are no historical tier snapshots, so I can explain the **drivers of the classification** rather than a literal moment of transition.

The revealing finding: across the portfolio, **credit fundamentals are essentially identical across all three tiers** — average score ~575, PD ~3.3%, LGD ~41.5% for Low, Medium *and* High. The one dimension that separates them is **Digital Adoption Score**: **82.9 (Low) → 47.5 (Medium) → 14.7 (High)**. So tier placement tracks disengagement plus a cluster of behavioral early-warning signals, not the credit score.

**Worked example** — the highest-warning high-risk customer, *Avery Reynolds (C001215)*: despite a **strong 818 credit score**, they accrued **6 early-warning signals in ~2 weeks** (three Missed Payments, a High-severity Deposit Volatility flag, a Limit-Utilization Spike) plus **2 AML alerts** (an Unusual Velocity alert scoring 83), and sit at the bottom of the portfolio on digital adoption (**14.5/100**). That combination — not the credit score — is what lands them in High.

## 2. AML alerts — last 24 hours
In the trailing 24-hour window (**Jul 3 3:59 PM → Jul 4 3:59 PM**): **475 alerts** across **461 distinct customers**, of which **95 (20%) are high severity** (risk score ≥ 80). Volume is spread fairly evenly across the four typologies, with **Structuring** leading:

- **Structuring** — 130 alerts (28 high severity)
- **Counterparty Concern** — 116 (22 high severity)
- **Unusual Velocity** — 116 (19 high severity)
- **High-Risk Geography** — 113 (26 high severity)

For context, the model holds 5,000 alerts over the prior ~10 days, so ~475/day is in line with the running average.

## 3. Liquidity changes across buckets
Treasury positions carry no time dimension, so this is the **current distribution across maturity buckets**, not a period-over-period change. The book is **evenly laddered** — roughly **$28B in each bucket** with no maturity concentration: **0–7D $28.9B · 8–30D $28.3B · 31–90D $28.2B · 90D+ $28.2B** (3,750 positions each).

Total liquidity is **~$113.5B across 15,000 positions**. The notable risk feature is currency: exposure is spread near-evenly across five currencies, leaving **FX exposure (all non-USD) at $90.8B — about 80% of the book**, with only ~20% held in USD. That's a high FX concentration worth flagging.

## 4. Digital engagement — client-ready narrative
> **Digital engagement is broad and stable.** Over the past month, all **10,000 monthly active users** engaged, with **~6,300 active on a typical day — roughly 63% daily stickiness**, an exceptionally healthy ratio for retail banking. Daily activity held steady near **10,000 events/day** with an engagement score consistently around **3.7**, showing no erosion in habit strength. Usage is **well-diversified across features** — Login, Bill Pay, Transfers, Card Controls, Profile and Treasury Approval each draw ~50,000 events, indicating customers rely on the platform for both everyday and higher-value actions rather than a single use case. **Mobile is the primary channel at 38% of activity**, ahead of Tablet (31%) and Web (31%), reinforcing a mobile-first engagement pattern. The single dip on Jul 4 (4,876 users) reflects a partial data day, not a real decline.

*(The report's DAU card shows 4,876 because it reads the latest, partial day; the ~6,300 figure is the typical full-day average.)*

The dashboard above breaks each of these out visually across four tabs. Want me to turn any of these into a client-ready deck, a one-page brief, or an email to your stakeholders?
