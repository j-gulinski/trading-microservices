---
phase: 7a
status: complete
reviewed: 2026-08-04
tags:
  - seams
  - decisions
  - real-data
  - instruments
  - curves
  - benchmark
---

# Phase 7a — real-data seam review (decisions, not features)

No code ships in this phase. Its output is five recorded decisions that E1–E5 build on, made now
because each of them is cheap to decide and expensive to discover halfway through building options,
IRS or alpha/beta. Read with the homework-5 lens: a real feed (Yahoo/OpenFin) replaces the
simulator, and strategies replace the random generator.

Every claim below was checked against the running system, not inferred from the plan.

## Phase outcome in one line

Five seams decided — instrument identity, curve semantics, benchmark ownership, the market-data
boundary and the strategy shape — plus **one live defect the review surfaced**: an instrument in the
catalog that the generator can never trade.

## What the review found before it decided anything

`SYMBOL_BY_CLASS` in `services/trade-generation-service/app/generator.py:20` is

```python
SYMBOL_BY_CLASS = {terms["asset_class"]: symbol for symbol, terms in INSTRUMENT_CATALOG.items()}
```

A dict comprehension keyed by asset class over a catalog that already has **two BOND instruments**.
Last one wins:

```
{'EQUITY': 'ACME', 'FX': 'EURUSD', 'BOND': 'GOVT_5Y', 'COMMODITY': 'XAUUSD', 'FUTURES': 'ES_FUT'}
BOND symbols in catalog: ['GOVT_2Y', 'GOVT_5Y']
```

`GOVT_2Y` has a complete term sheet, is priced correctly by `bond_pv`, and **has never been
traded**. Confirmed against the database — 293 generated trades across five symbols, zero
`GOVT_2Y`:

```
 symbol  |  source   | count
 ACME    | GENERATED |    60      ES_FUT  | GENERATED |    69
 EURUSD  | GENERATED |    58      GOVT_5Y | GENERATED |    52
 XAUUSD  | GENERATED |    53
```

This is not a future problem that options and IRS would have introduced. It is a present one, and
it is silent — no error, no log line, just an instrument that quietly never appears.

**The same shape appears twice more:**

- `book_client.ensure_books()` builds `{expected_asset_class: book_id}` from the books list. Since
  6b-1 the user can create a second EQUITY book — and from that moment the generator binds to
  whichever EQUITY book sorts last out of `GET /books`, with no indication that it switched. A
  feature added in 6b-1 silently changed the behaviour of a service written in Phase 4.
- `generator._books` carries that same one-per-class dict into `_build_open`.

**Recorded as E1 scope**, not fixed here — this phase ships no code, and the fix is exactly the
instrument-universe migration E1 exists to do. The severity is low today (one unreachable
instrument, a generator that may pick an unexpected book), which is why it waits rather than jumping
the queue.

## The five decisions

### 1. Instrument universe — `instrument_id` becomes the identity, `symbol` becomes the market key

The restructure everyone expected (a class holds many symbols; instruments carry parameters) turns
out to need **no new concept** — the schema already has the column.

`trades.instrument_id` exists and is currently set to the symbol (`repository.insert_trade`:
`instrument_id=symbol, symbol=symbol`). It is dead weight today and exactly the right hook
tomorrow. The split:

| column | meaning | equity | option | IRS |
|---|---|---|---|---|
| `instrument_id` | what was traded | `ACME` | `ACME_C_105_2027-01` | `IRS_USD_5Y_0425` |
| `symbol` | **what market data revalues it against** | `ACME` | `ACME` | *(none — curve)* |

The payoff: **pricing's dispatch does not change.** `cache.trades_for_symbol(symbol)` already
revalues every trade whose `symbol` matches an incoming tick, and `bond_trades()` already revalues
every curve-dependent trade on a curve tick. An option on ACME revalues on the ACME tick for free,
because it declares ACME as its market key.

Instrument **parameters** stay where they already are: `trades.metadata` (JSONB), copied from the
catalog at insert time. This is already the right design and it was not obvious — a trade carries
the terms it was struck under, so a later catalog edit cannot retroactively change what an old trade
means. Strike, expiry, and swap legs are more JSONB keys, not more columns.

**What E1 must change**, precisely:

- `INSTRUMENT_CATALOG` gains an `instruments` table (seeded from the current dict, so today's
  symbols survive) — the catalog becomes the seed, not the source of truth.
- `SYMBOL_BY_CLASS` is replaced by a *list* per class, and the generator picks within it. Note the
  frontend is already there: `tradeableInstrumentsOf(instruments, assetClass)` filters a list.
  **The browser has been many-instruments-per-class ready since 6b-1; only the backend is not.**
- `ensure_books()` stops keying books by asset class.
- `insert_trade` stops defaulting `instrument_id` to `symbol`.

**Rejected:** a table per instrument type (options table, swaps table). It multiplies the pricing
dispatch by the number of types and makes "all trades in this book" a union query, for the sake of
column-level typing on fields only the pricer reads.

### 2. Curve representation — the arrays stay, the *semantics* get written down

The wire and table format is `{curve_name, curve_type, currency, tenors: [...], rates: [...]}` —
parallel arrays, JSONB in `market_data_curves`, the same shape on the `curve_tick` SSE event. That
shape is fine for IRS and stays.

What is **not** fine is that its meaning is undeclared, and IRS is exactly where an undeclared
convention becomes a wrong number.

Three things this review pins down:

- **It is a zero (spot) curve, not a par-yield curve.** `bond_pv` discounts each cashflow at
  `rate_at(t)` independently — that is only correct for zero rates. But `curve_type` says
  `"YIELD"`, and `CurveType` offers `YIELD` / `DISCOUNT` / `FX_FORWARD`, none of which says zero.
  **Decision: `curve_type` becomes `ZERO`,** and `YIELD` is retired for this curve. A par curve
  interpreted as zeros misprices every multi-cashflow instrument, quietly and in the same direction.
- **Compounding is annual**, from `(1 + r) ** t` in `bond_pv`. Written down because IRS floating
  legs need forwards derived from the *same* convention:
  `f(t₁,t₂) = ((1+r₂)^t₂ / (1+r₁)^t₁)^(1/(t₂−t₁)) − 1`. Deriving forwards under continuous
  compounding from an annually-compounded curve is a small, plausible, invisible error.
- **`tenors` must be strictly ascending, and that is a contract, not a habit.** `rate_at` walks the
  array assuming order and returns a silently wrong interpolation if it is violated. Nothing
  enforces it today; the simulator happens to emit it sorted.

**Real-rates implication (homework 5):** public sources publish *par* yields (Treasury CMT is the
obvious one). Bootstrapping par → zero belongs **in the adapter, behind the market-data boundary** —
so pricing keeps consuming exactly one curve shape and never learns where it came from. That is
the whole point of decision 4.

**Rejected:** publishing discount factors instead of rates. It removes the interpolation question
(you interpolate log-DF linearly and you are done) but makes the Market Data screen unreadable —
nobody eyeballs 0.9573 to sanity-check a 5-year rate. Human-inspectable market data has been a
property of this app since Phase 3 and it stays.

### 3. Benchmark ownership — pricing owns it, the window is derived state, not a table

`MARKET_INDEX` is published by market-data as an equal-weighted ratio basket of ACME/XAUUSD/ES_FUT,
on the ordinary `market_tick` event, persisted like any other spot. It is untradeable in practice
because no book has `expected_asset_class = INDEX` — the 6b-1 "books are the authority for tradeable
classes" contract already fences it off. Nothing needs to change about the benchmark itself.

**Pricing owns the rolling window.** It already holds the three things alpha/beta needs: the spot
cache (including `MARKET_INDEX`), the active-trade set refreshed every 2 s, and the valuation stream
that is the only place per-book risk can be published. A separate analytics service would be a
deployment unit for two numbers per book.

**The window is in-memory, rebuilt on startup from `valuations` and `market_data_spot_prices`.** No
new table: both inputs are already persisted, so the window is derived state — the same reasoning
that keeps the blotter's trade cache out of the schema.

The homework names three edge cases. The answers, decided now because each one is a place where
returning a plausible number is worse than returning nothing:

- **Gaps.** Book valuations and index ticks are not aligned in time — different producers, different
  cadences. **Decision: sample both series onto a fixed grid (last value wins per bucket), and drop
  a bucket from *both* series if either lacks an observation** (pairwise deletion on aligned pairs).
  The naive alternative — one observation per event — weights a busy interval more heavily than a
  quiet one, which is precisely the bias that makes a beta meaningless.
- **Too few observations.** Below a minimum pair count, return `null`. Not zero, not a beta computed
  from four points.
- **Zero benchmark variance.** `beta = cov/var` divides by zero. Return `null`. This is *reachable*,
  not theoretical: early after startup the index has barely moved and the window is short.

`BookRiskCard` already renders `n/a` with a stated reason ("Pricing does not publish book alpha/beta
yet"), so the honest-null path has a UI. **E4 wires values into an existing shape rather than
inventing one.**

Sanity vector for E4's review: beta of `MARKET_INDEX` against itself ≈ 1.0, alpha ≈ 0.

**Real-data survivability:** overnight gaps and holidays are just empty buckets, which the pairwise
rule already drops. The rule was chosen for real bars, not for the simulator — under the simulator
alone, "every tick is an observation" would have worked and would have had to be rewritten.

### 4. Market-data boundary — the contract holds; three things leak

**Verdict: `GET /snapshot` + `GET /stream` with named events (`market_tick`, `curve_tick`) is the
right seam, and a Yahoo/OpenFin producer can stand behind it with no consumer change.** Both
consumers — pricing's hand-rolled SSE line parser and the browser's `EventSource` — depend only on
event names and payload keys.

Three simulator assumptions do leak past it, and each is a concrete E-phase task:

1. **`source` is hardcoded `"SIMULATED"`** in `persistence._save_spot`. It is the single field that
   names the producer, and it currently lies by construction for any other producer. One-line fix,
   but it has to be *the adapter's* value.
2. **Staleness thresholds are tuned to a metronome.** Every instrument ticks every
   `TICK_INTERVAL_MS` ± 20 %, always, so a global `MARKET_STALE_AFTER_MS = 5000` and
   `VALUATION_STALE_AFTER_MS = 10000` are safe. Real feeds have quiet instruments — an FX pair
   silent for six seconds at 03:00 is not stale, it is a market. **Decision: staleness becomes
   per-asset-class configuration before any real feed lands**, or the UI will report a healthy feed
   as broken. This is the leak most likely to be discovered late, because it looks like a UI bug.
3. **`event_id` is a single global counter** (`persistence.ticks_generated`) incremented under one
   lock by six generator threads, and the browser uses it for ordering. A multi-source real adapter
   cannot cheaply produce one global monotonic sequence from independent upstreams. **Decision: it
   is documented as publisher-assigned sequencing — a property of the connection, not of the
   market.** The value is already assigned at publish time, so the contract holds; only the
   documentation was missing.

Checked and found **not** leaking: `pickSpotValue` is already `mid ?? last ?? spot`, so a
delayed source that publishes only `last` works; the index being *derived* from other instruments is
an implementation detail entirely inside market-data; `curve_tick` and `market_tick` are separate
event names, so a real curve source can replace one without touching the other.

**Constraint restated (in force since 6b):** anything simulator-specific stays behind this boundary.
Nothing in 6b-1, 6b-2 or 6c crossed it.

### 5. Strategies — an intent producer, and `source` becomes the producer's name

Today there are already two intent producers: the generator (`gen-` prefixes, `source: GENERATED`)
and the browser (`manual-` prefixes, `source: MANUAL`). A strategy is a third. It needs no new
service — it is a loop that reads market data and posts `POST /trade-actions`, which is what the
generator already is.

What that costs, precisely:

- **`source` becomes the producer identity**, not a two-value enum: `GENERATED`, `MANUAL`, and one
  value per strategy. The column is `Text`, so this is an enum edit, not a migration.
- **`client_request_id` generalizes to `<producer>-<action>-<uuid>`**, which `gen-open-…` and
  `manual-open-…` already are. The prefix stops being the *only* automated marker; `source` becomes
  authoritative and the prefix stays a correlation aid.
- **One concrete frontend bug this creates**, worth naming now: `domain/generator.js`
  `isGeneratedIntent()` classifies an audit row by `correlationId.startsWith('gen-')` and labels
  everything else `MANUAL`. A strategy's intents would be **displayed as manual trades** on the
  Generator screen. The fix is to classify on `source`, which requires the audit payload to carry
  it — which is the same payload widening E5 already needs for the `ms` column.
- **The producer host must hold the stream, not poll the snapshot.** `generate_once()` does one
  `fetch_snapshot()` HTTP call per intent — fine for a coin flip, useless for a strategy, which
  needs a rolling series. A strategy host subscribes to `/stream` like pricing does.

**Rejected:** strategies as a plug-in interface with registration and lifecycle hooks. At two
strategies that is more framework than strategy; the interface is already `POST /trade-actions`,
and it is a network boundary, which is a better plug-in point than a Python base class.

## Mental model: what these five decisions fence off

```
   real feed (homework 5)                    simulator (today)
        │  par yields, irregular ticks            │  zero curve, metronome
        └──────────► market-data-service ◄────────┘
                       │  bootstraps · assigns event_id · sets source
                       │
        GET /snapshot + GET /stream (market_tick · curve_tick)   ← decision 4: the seam
                       │
        ┌──────────────┼───────────────────┐
        ▼              ▼                   ▼
     pricing        browser        intent producers  ← decision 5
   │ zero curve,   │ per-class      generator · strategies · (browser)
   │ annual comp.  │ staleness      all → POST /trade-actions
   │  ← decision 2 │  ← decision 4     source = producer identity
   │
   └─ alpha/beta window, in memory, rebuilt on startup   ← decision 3
        MARKET_INDEX vs book returns, pairwise-deleted grid

   trades.instrument_id = what was traded   ← decision 1
   trades.symbol        = what revalues it
   trades.metadata      = the terms it was struck under
```

## Honest gaps

- **Nothing here is verified by running code**, because nothing was built. The findings are verified
  (the `GOVT_2Y` collision was reproduced and confirmed against the database); the decisions are
  arguments, and E1–E5 are where they meet reality.
- **Options are decided only as far as identity and revaluation keying.** Black–Scholes inputs —
  where implied volatility comes from, whether the simulator publishes a vol surface or E2 assumes a
  flat vol — is deliberately left to E2. It is a pricing question, not a seam question, and deciding
  it now would be guessing.
- **Day-count conventions are not decided.** `bond_pv` uses year fractions directly (`t = i / ppy`)
  with no ACT/360 or 30/360 anywhere. IRS floating legs conventionally need one. E3 either adopts
  the same simplification explicitly, or introduces day count as an instrument parameter — this
  review flags the choice rather than pre-empting it.
- **The staleness-threshold change (decision 4, leak 2) has no owner phase.** It is not E1–E5 work
  and it is not needed until a real feed exists. Recorded here so it is not rediscovered as a UI bug
  in homework 5.

## Verification performed

Only claims, since there is no build:

- `SYMBOL_BY_CLASS` collision reproduced by evaluating the comprehension against the real catalog;
  `GOVT_2Y` shown absent from 293 generated trades in the live database.
- `ensure_books()` and `generator._books` read and confirmed one-per-class.
- `bond_pv` read to establish zero-curve semantics and annual compounding; `rate_at` read to
  establish the ascending-tenor requirement.
- `trades.instrument_id` confirmed present in `shared/models.py` and confirmed set to `symbol` in
  `trade-action-service/app/repository.py`.
- `cache.trades_for_symbol` / `bond_trades` read to confirm the option-on-underlying revaluation
  path needs no dispatch change.
- `pickSpotValue`, `tradeableInstrumentsOf` and `isGeneratedIntent` read on the frontend side to
  confirm which consumers already tolerate the change and which one breaks.

## Concepts seen for the first time in this phase

- **A lossy dict comprehension is a silent schema assumption.** `{terms["asset_class"]: symbol …}`
  does not say "one symbol per class" anywhere, it just behaves that way, and there is no error when
  the assumption breaks — only an instrument that stops existing. Any comprehension keyed on a
  non-unique field is asserting uniqueness without saying so.
- **Conventions are part of a data contract.** `{tenors, rates}` is not a curve until you say
  whether the rates are zero or par and how they compound. The shape was never the risk.
- **Deciding the null cases is deciding the feature.** Alpha/beta is arithmetic; what makes it
  trustworthy is that too-few-observations and zero-variance return nothing rather than a number
  that looks like an answer.
- **Deciding before building is a phase.** Every seam here would have been discovered mid-build in
  E1–E5 and answered under pressure, in whatever way unblocked the commit.

## Files read for this review

`shared/catalog.py` · `shared/pricing_math.py` · `shared/models.py` (Trade, MarketDataCurve) ·
`services/trade-generation-service/app/{generator,book_client}.py` ·
`services/market-data-service/app/{generator,persistence}.py` ·
`services/pricing-service/app/{valuation_engine,cache,market_data_client}.py` ·
`services/trade-action-service/app/repository.py` ·
`frontend/src/domain/{marketData,tradeActions,generator}.js` ·
`frontend/src/config/{marketData,valuations}.js`

## Known limits

- E1 inherits the `SYMBOL_BY_CLASS` / `ensure_books` fix; until then `GOVT_2Y` stays untraded and a
  second book of an existing class may capture the generator.
- Vol surface (E2), day count (E3) and the staleness-threshold change are named but not decided.
- Phase 7b — the consolidation sweep — is deliberately **not** started: the plan orders it after
  E1–E5 so their build debris is included, and sweeping a floor before the building work would
  deposit new leftovers on a clean one.
