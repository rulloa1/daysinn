# Days Inn Housekeeping & Front Desk Tool — Project Context

## Purpose and operating context

This repository supports the **Days Inn Housekeeping & Front Desk Tool**, a property-operations platform for **Days Inn by Wyndham** within the wider **Wyndham Hotels & Resorts** network. The active local pilot location is **Wildwood, Florida**, near I-75 and State Route 44. Its primary users are front-desk agents and housekeepers.

The intended frontend integration platform is **Antigravity**. Product decisions, code changes, sprint planning, and documentation must preserve a clear distinction between the present shadow pilot and any future certified corporate integration.

> **Current state:** The Wildwood pilot operates as a standalone tool. It has no active connection to Wyndham, MuleSoft, Sabre SynXis Property Hub, Oracle OPERA Cloud, or any other corporate production system.

## Phase 1: shadow-pilot requirements

During Phase 1, front-desk agents use a secondary-monitor dashboard and housekeepers use mobile web or tablet interfaces. The platform should improve local operations without sending data to external property-management systems.

| User group                    | Primary surface                        | Phase 1 objectives                                                                                                                           |
| ----------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Front desk                    | Secondary-monitor operations dashboard | See room readiness, prioritize guest-impacting exceptions, reduce radio and phone coordination, and track check-in readiness.                |
| Housekeeping                  | Mobile web or tablet workspace         | Receive a prioritized shift queue, update room progress rapidly, report exceptions, and work safely through corridor Wi-Fi or cellular gaps. |
| General manager or supervisor | Workload and exception view            | Balance assignments, identify at-risk rooms, measure service throughput, and document pilot outcomes.                                        |

The shadow pilot must collect operational evidence without exposing guest or corporate-system credentials. Initial performance measures are **time saved per room check-in** and **phone-call reduction logs**. Future measurements may include room turnaround time, number of reassigned rooms, DND exceptions, maintenance escalation time, and offline synchronization recovery rate.

## Future data-touchpoint model

The target integration model distinguishes reads from writes. These are future goals only and must not be implemented against live systems until the Wyndham approval sequence has completed.

| Direction | Target data touchpoint                                   | Intended outcome                                                                     |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Read      | Morning checkout logs and dirty-room queues              | Initialize front-desk and housekeeping workload views from authorized property data. |
| Write     | Room-status log updates, including **Clean & Inspected** | Return authorized readiness updates to the approved property-management ecosystem.   |

All future corporate-system traffic must route through **Wyndham’s MuleSoft API layer**. Direct connections from this application to **Sabre SynXis Property Hub**, **Oracle OPERA Cloud**, or other backend systems are out of scope unless explicitly approved through the corporate process below.

## Wyndham approval pipeline

Every roadmap item involving external data, credentials, sandbox access, or production connectivity must be aligned with this four-step sequence.

| Step                                        | Required milestone                                                                                                            | Repository and sprint implication                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1. Franchise sponsor action                 | The Wildwood GM or franchisee submits the official technology-integration request through the Wyndham Community owner portal. | Continue shadow-pilot development; do not request or use live-system credentials.                        |
| 2. Vendor onboarding and audit              | Prepare legal-entity status, business-insurance evidence, and PCI DSS handling review for applicable reservation elements.    | Document data handling, minimize reservation data, and prepare security artifacts.                       |
| 3. API sandbox verification                 | Receive approved sandbox API keys through the corporate developer environment and simulate MuleSoft transactional payloads.   | Add a sandbox-only adapter, contract tests, payload logging controls, and credential isolation.          |
| 4. Compliance check and pilot authorization | Clear brand operations UI/UX evaluation and receive authorization before enabling live connectivity.                          | Perform acceptance testing, obtain approval, and gate production writes behind an explicit feature flag. |

## Technical directives

### Offline synchronization

The Antigravity frontend must be designed for intermittent cellular and Wi-Fi coverage in motel corridors. New workflow features should follow these rules:

1. **Local-first mutations.** Persist in-progress room actions locally before attempting network synchronization.
2. **Explicit sync state.** Show pending, synced, failed, and conflict states; never imply a remote update succeeded before acknowledgment.
3. **Idempotent writes.** Attach stable client operation IDs so retries cannot duplicate room-status changes, notes, requests, or audit events.
4. **Conflict-safe resolution.** When a room changes on another device, preserve enough event history for users or supervisors to understand and resolve the discrepancy.
5. **Minimal offline data.** Cache only the data necessary to perform the active shift safely; avoid persisting unnecessary guest-sensitive fields on devices.
6. **Recoverable failures.** Give staff a clear retry path and keep work visible when a synchronization attempt fails.

### Automation and operational logging

Localized functions may support front-desk alerts, housekeeping status logs, workload warnings, and pilot metrics. They must preserve the current standalone boundary, be deterministic where possible, and remain compatible with a future sandbox adapter.

Room-status automation should treat the audit trail as operational evidence. Important events include assignment, start, clean, inspection, DND, maintenance escalation, skip reason, reassignment, and synchronization outcome.

## Architecture guardrails

The following rules apply to all forthcoming work:

- Do not add active corporate API connections during the shadow pilot.
- Do not add or request Wyndham, MuleSoft, SynXis, OPERA, or production property-management credentials without the corresponding approval-stage evidence.
- Keep integrations behind replaceable adapters, feature flags, and environment-specific configuration.
- Prefer front-desk and housekeeping workflows that can operate locally first and synchronize later.
- Keep all external credentials out of source control, client bundles, screenshots, logs, and demo data.
- Treat the Wildwood pilot as a local operational tool until corporate authorization changes its status.

## Definition of done for future work

A new feature is ready for the shadow pilot only when it has an identified user workflow, offline behavior, audit outcome, mobile or dashboard validation as applicable, and a measurable impact on pilot metrics. A feature is ready for sandbox or production integration only when it also satisfies the appropriate Wyndham pipeline stage and environment-specific security controls.
