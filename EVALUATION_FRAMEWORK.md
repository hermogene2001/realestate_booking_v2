# User Acceptance Evaluation Framework

## Overview

This document provides the methodology and instruments for evaluating the Kigali Real Estate Booking platform's effectiveness, security, and user acceptance in preventing deposit fraud compared to traditional intermediary methods.

---

## 1. Evaluation Objectives

| # | Objective | Metric | Target |
|---|-----------|--------|--------|
| E1 | Measure user satisfaction with the booking flow | SUS Score | ≥ 68 (above average) |
| E2 | Assess perceived security vs. traditional cash deposits | Comparative rating | ≥ 4/5 |
| E3 | Evaluate ease of use for non-technical users | Task completion rate | ≥ 80% |
| E4 | Validate fraud prevention effectiveness | Fraud alert accuracy | ≥ 90% |
| E5 | Compare transaction friction vs. traditional agents | Time/cost comparison | ≤ 50% reduction |

---

## 2. Evaluation Methods

### 2.1 User Acceptance Testing (UAT)

**Participants**: 20-30 Kigali residents (mix of TENANTs, OWNERs, and agents)

**Recruitment criteria**:
- 50% have used traditional rental agents in the past 2 years
- 30% are non-technical users (no prior crypto/wallet experience)
- 20% are property owners who have collected deposits

**Test environment**: Staging deployment at `https://staging.kigalire.rw` with pre-funded test ETH accounts and MoMo sandbox

**Task list**:

| Task | User Role | Max Time | Success Criteria |
|------|-----------|----------|-----------------|
| T1: Register account | New user | 3 min | Account created, JWT issued |
| T2: Browse properties | Any | 2 min | Properties listed with map view |
| T3: Book a property | TENANT | 5 min | Booking created in PENDING status |
| T4: Deposit ETH | TENANT | 10 min | Tx hash recorded, booking → LOCKED |
| T5: Confirm handover | TENANT | 2 min | Tenant confirmed, booking → COMPLETED |
| T6: List property | OWNER | 5 min | Property created, documents uploaded |
| T7: Review documents | ADMIN | 3 min | Document approved/rejected |
| T8: Cancel booking | TENANT | 3 min | Booking cancelled, refund initiated |
| T9: Raise dispute | TENANT | 3 min | Booking → DISPUTED status |
| T10: Enable 2FA | Any | 3 min | 2FA enabled, backup codes shown |

### 2.2 System Usability Scale (SUS) Survey

Administered after UAT completion. Standard 10-item SUS questionnaire:

```
1. I think that I would like to use this system frequently
2. I found the system unnecessarily complex
3. I thought the system was easy to use
4. I think that I would need the support of a technical person to use this system
5. I found the various functions in this system were well integrated
6. I thought there was too much inconsistency in this system
7. I would imagine that most people would learn to use this system very quickly
8. I found the system very cumbersome to use
9. I felt very confident using the system
10. I needed to learn a lot of things before I could get going with this system

Each item: 1 (Strongly Disagree) to 5 (Strongly Agree)
```

**Scoring**: Standard SUS calculation (score range 0-100)

### 2.3 Perceived Security Questionnaire

```
PS1: I trust that my deposit is safe in the smart contract
     [1] Strongly Disagree [2] Disagree [3] Neutral [4] Agree [5] Strongly Agree

PS2: Compared to giving cash to a rental agent, this system is ___ secure
     [1] Much Less [2] Less [3] Same [4] More [5] Much More

PS3: I understand how the escrow system protects my deposit
     [1] Not at all [2] Slightly [3] Moderately [4] Well [5] Very Well

PS4: The blockchain transaction process was intimidating
     [1] Strongly Disagree [2] Disagree [3] Neutral [4] Agree [5] Strongly Agree

PS5: I would recommend this platform to a friend/family member
     [1] Definitely Not [2] Probably Not [3] Neutral [4] Probably [5] Definitely
```

### 2.4 Comparative Analysis: Platform vs. Traditional Agent

| Criterion | Traditional Agent | This Platform | Improvement |
|-----------|-------------------|---------------|-------------|
| Deposit custody | Agent holds cash | Smart contract holds ETH | ✅ Eliminates theft risk |
| Deposit size (Kigali typical) | 1-3 months rent | 1 month (configurable) | ✅ Lower barrier |
| Booking confirmation time | 1-3 days (manual) | < 1 minute (automated) | ✅ 99% faster |
| Cancellation refund | Agent-dependent, 50-100% | Smart contract enforced, 90% | ✅ Predictable |
| Dispute resolution | Informal, biased | Admin-mediated, on-chain | ✅ Transparent |
| Fraud detection | None | 6 automated rules + human review | ✅ Proactive |
| Identity verification | Copy of ID (forged easily) | KYC documents + admin review | ✅ Harder to forge |
| Multi-lingual support | Language-dependent | EN/RW/FR/SW | ✅ Wider reach |
| Payment methods | Cash only | ETH / MoMo / Card | ✅ More options |
| Record keeping | Paper receipts | Immutable blockchain + DB audit | ✅ Verifiable |

---

## 3. Technical Evaluation Metrics

### 3.1 Smart Contract Security

| Check | Method | Standard |
|-------|--------|----------|
| Reentrancy protection | OpenZeppelin ReentrancyGuard | ✅ Inherited |
| Access control | onlyAdmin, onlyParty modifiers | ✅ Implemented |
| Emergency pause | OpenZeppelin Pausable | ✅ Inherited |
| Integer overflow | Solidity 0.8+ built-in checks | ✅ Compiler version |
| Front-running resistance | State-dependent logic | ✅ Requires both parties |
| Oracle dependency | None (no external price feeds) | ✅ Self-contained |
| Gas optimization | Optimizer enabled (200 runs) | ✅ hardhat.config |

### 3.2 Backend Security

| Check | Tool/Method | Status |
|-------|-------------|--------|
| Input validation | Zod schemas | ✅ 15+ schemas |
| SQL injection | Prisma ORM (parameterized queries) | ✅ Inherent |
| XSS protection | Next.js automatic escaping | ✅ Built-in |
| CSRF | JWT Bearer tokens (not cookies) | ✅ Stateless |
| Rate limiting | express-rate-limit | ✅ Configured |
| Auth bypass | JWT verification middleware | ✅ On all protected routes |
| RBAC enforcement | authorize() middleware | ✅ On role-gated routes |
| Dependency audit | npm audit | ⚠️ Run before launch |

### 3.3 Fraud Detection Effectiveness

| Rule | False Positive Risk | Detection Method |
|------|-------------------|------------------|
| Rapid bookings (>5/day) | Group bookings | Count per tenantId |
| Rapid cancellations (>3/week) | Legitimate changes | Count per tenantId |
| Quick handover (<10 min) | Genuine fast check-in | Time diff calculation |
| Duplicate wallet | Shared family wallet | groupBy walletAddress |
| Price manipulation (>3 changes/week) | Dynamic pricing | Property update count |
| Same-IP multiple accounts | Shared workspace | Future: IP middleware |

---

## 4. Data Collection Instruments

### 4.1 Session Recording
- Use Hotjar or LogRocket for session replays
- Track: clicks, navigation paths, form abandonment
- Identify: where users get stuck, which steps take longest

### 4.2 Analytics Events
```typescript
// Events to track via backend analytics
{
  "event": "booking_created" | "deposit_initiated" | "deposit_confirmed" |
           "handover_confirmed" | "dispute_raised" | "fraud_alert_triggered",
  "userId": number,
  "bookingId": number,
  "timestamp": ISO8601,
  "duration_ms": number,  // time spent on step
  "device": "mobile" | "desktop" | "tablet",
  "payment_method": "ETH" | "MOMO" | "CARD"
}
```

### 4.3 Post-Study Interview Questions

1. "What was your biggest concern before using this platform?"
2. "Did you feel your deposit was secure throughout the process?"
3. "What part of the process was confusing or difficult?"
4. "Would you use this instead of a traditional rental agent? Why/why not?"
5. "How did you find the wallet setup / MoMo payment experience?"
6. "What feature would you add to make the platform more useful?"

---

## 5. Evaluation Schedule

| Phase | Activity | Duration | 
|-------|----------|----------|
| 1. Setup | Deploy staging, fund test wallets, configure MoMo sandbox | 2 days |
| 2. Pilot | Test with 5 internal users, refine tasks | 1 day |
| 3. Recruitment | Recruit 20-30 participants via Kigali community groups | 5 days |
| 4. Sessions | One-on-one UAT sessions (30-45 min each) | 5 days |
| 5. Surveys | SUS + security perception questionnaire | 1 day |
| 6. Analysis | Compile results, calculate metrics, write report | 3 days |
| 7. Report | Final evaluation report with recommendations | 2 days |

**Total**: ~19 working days

---

## 6. Success Criteria

| Metric | Target | Stretch Goal |
|--------|--------|-------------|
| SUS Score | ≥ 68 | ≥ 80 |
| Task completion rate | ≥ 80% | ≥ 95% |
| Perceived security (vs. traditional) | ≥ 4/5 | ≥ 4.5/5 |
| First-time booking time | ≤ 15 min | ≤ 10 min |
| Fraud alert precision | ≥ 90% | ≥ 95% |
| User recommendation rate | ≥ 80% | ≥ 90% |
| Transaction cost vs. agent fee | ≤ 50% of agent fee | ≤ 25% of agent fee |

---

## 7. Deliverables

After evaluation, produce:
1. **Evaluation Report** — Full findings with data, charts, and analysis
2. **Improvement Roadmap** — Prioritized list of UX/security improvements
3. **Comparative Analysis** — Platform vs. traditional methods with quantified benefits
4. **Fraud Prevention Report** — Detection rates, false positives, rule refinements
5. **Executive Summary** — Key findings for stakeholders
