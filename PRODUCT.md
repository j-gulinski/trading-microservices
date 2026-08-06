# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the creator: a developer using the product as a hobby and portfolio project to learn, demonstrate, and inspect trading-system architecture end to end. Portfolio reviewers and other developers may evaluate the system through the running application and its documentation.

The long-term operational audience is deliberately undecided. The project may eventually serve users working with real market ticks and valuations, but it is not currently positioned as a production trading tool.

## Product Purpose

Trading Microservices is a local trading and risk simulation that makes the complete path from market movement to browser-visible valuation and PnL inspectable. It exists both as a working system and as evidence of the creator's ability to design clear service boundaries, real-time data flows, durable business history, and an operator-facing frontend.

Success means the simulated system remains understandable and demonstrable while becoming credible enough to accept real valuation and market-tick inputs later. The current goal is an accomplished portfolio project aspiring toward the qualities of a real trading workstation, without claiming production readiness prematurely.

## Positioning

The product combines a compact, locally runnable simulation with realistic ownership and delivery boundaries: one writer per business entity, explicit event ordering, durable history, bounded queues, snapshot-and-stream reconciliation, terminal trade-close state, and live browser updates. Its distinguishing value is that the full lifecycle can be inspected in one repository rather than hidden behind a toy dashboard or isolated service examples.

## Operating Context

The system runs locally through Docker Compose and is explored through a React browser application. Its normal demonstration flow covers simulated market events, opening and closing trades, continuous valuation, book-level and trade-level PnL, service health, audit events, and trade-generator controls.

High-frequency prices and valuations reach the browser through shared SSE feeds; slower operational state is polled over HTTP. PostgreSQL holds durable trades, valuations, books, market snapshots, and audit history. Scenario files under `scenarios/` exercise representative API workflows, while `README.md` and `docs/phase-*-notes.md` explain architecture and implementation decisions.

## Capabilities and Constraints

- Market Data generates and persists simulated spot, futures, FX, index, and curve events and publishes snapshots plus SSE.
- Trade Action validates intents and is the sole writer of trade lifecycle state.
- Trade Generator produces bounded simulated open and close activity.
- Pricing consumes market events, values active trades, persists valuations, and publishes PnL.
- Blotter combines live caches with durable history for trade- and book-oriented reads.
- Books owns trading-book configuration; Monitoring aggregates health and important audit events.
- The frontend provides system, generator, trade-action, business, market-data, valuation, book, and trade-blotter views, plus new-trade and management panels.
- The current market data is simulated. Wiring the system to real ticks and valuations is a planned direction, but the source, scope, timing, and resulting operational audience are undecided.
- The current architecture favors inspectability and bounded demonstration load over production-scale throughput. Pricing persistence, replay guarantees, and lifetime-history growth have documented limits in `README.md`.
- Writes rely on server truth rather than optimistic client updates. Trade closing and book retirement use guarded ownership rules, and idempotency protects retried trade intents.

## Evidence on Hand

- The complete runnable implementation is present across `services/`, `shared/`, `db/`, and `frontend/`.
- `README.md` documents the system boundary, data flow, ownership decisions, scaling evidence, and current limitations.
- `scenarios/` contains HTTP workflows for market data, trades, idempotency, closing, PnL, errors, and scenario analysis.
- `docs/phase-*-notes.md` contains learning-oriented explanations of the implemented frontend phases.
- Existing screen references are stored in `docs/designs/`, and a Figma file is linked from `frontend/README.md`.
- No testimonials, customers, production benchmarks, regulatory claims, or deployment proof are established; future work must not fabricate them.

## Product Principles

1. Keep the entire market-event-to-PnL path inspectable and explainable.
2. Preserve explicit ownership, ordering, and durable-history boundaries even in a small simulation.
3. Use honest live, stale, unavailable, accepted, and completed states instead of hiding system behavior.
4. Evolve toward real data and workstation credibility without overstating present readiness.
5. Make the portfolio experience feel intentional, polished, and free of generic or careless design decisions.

## Accessibility & Inclusion

No product-specific accessibility standard has been selected yet. The existing web interface includes semantic labels and status messaging in parts of the application; a formal target remains an open decision for future design work.
