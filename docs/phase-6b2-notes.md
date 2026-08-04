---
phase: 6b-2
status: complete
reviewed: 2026-08-04
tags:
  - backend
  - books
  - trade-action
  - blotter
  - lifecycle
---

# Phase 6b-2 — Book lifecycle: delete guard, reassignment, per-book Flatten (teaching notes)

The first phase where the browser can destroy something. 6b-1 wrote new rows; this one closes
positions and retires books, so every decision here is about what the system must *refuse*.

## Phase outcome in one line

`Flatten` and `Delete` from the mockup are real, and both are safe because the backend refuses them
when it should — a delete guard in books-service, a new `REASSIGN_TRADES` action type in
trade-action-service, and a `book_id` filter on close-all that stops per-book Flatten from closing
the whole firm's book.

## What was decided and why

### 1. The guard is on *open* positions, not on *any* trade

The plan said "refuse when the book has trades". Taken literally that makes the feature useless:
`DELETE /books/{id}` is a **soft delete** (`is_active = False`), and the plan also settled that
closed trades stay attributed to the book they happened in. So a book that ever traded would carry
its closed history forever and could never be retired — "allowed once empty" would be unreachable
even after a perfect move.

The guard is therefore **no ACTIVE trades**. The semantics that fall out are coherent: deleting a
book means *it stops accepting trades and leaves the roster*, not *it never existed*. The row
survives, its closed trades keep pointing at it, and their realized PnL stays attributed to where
it was earned.

The alternative — a hard delete — was never on the table: it would need `ON DELETE CASCADE` across
trades and valuations, which is a data-loss button, not a lifecycle operation.

### 2. Guarding `DELETE` alone would have left the front door open

`PUT /books/{id}` copies whitelisted fields straight from the body, and `is_active` is one of them.
`deactivate_book` is literally `update_book(book_id, {"is_active": False})`. A guard on the DELETE
route only would have been bypassable by the PUT that the same service already exposes — and by the
edit form, one field away.

The guard sits in front of **both** routes: `PUT` is checked whenever the body carries
`is_active: false`. This is the general shape of the mistake: the rule has to live at the state
transition, not at the URL that happens to be the obvious one.

### 3. books-service asks the blotter over HTTP, and **fails closed**

books-service shares the database, so it *could* have queried the `trades` table directly. It
doesn't. Trade reads belong to the blotter — the same ownership rule that keeps every trade mutation
inside trade-action-service. 6a set the precedent when trade-generation grew a `blotter_client.py`
to seed its open set; this is the second instance of that pattern, not a new one.

**The consequence that matters:** if the blotter cannot answer, the delete is **refused with 503**,
not allowed. A destructive operation that cannot verify its own precondition must not proceed. The
two refusals are deliberately different codes so the UI can say different things — `409` is *you
can't*, `503` is *we can't tell*.

The cost is honest: books-service now has a runtime dependency it did not have before, on a path
that used to be pure local state.

### 4. Reassignment is a trade mutation, so it lives in trade-action-service

Settled in the plan review and confirmed by the code: `REASSIGN_TRADES` joins `OPEN_TRADE`,
`CLOSE_TRADE` and `CLOSE_ALL` in the same queue, worker and audit path. Moving a trade between books
is a write to `trades`, and `trades` has exactly one writer.

Validation reuses the rule that already guards `OPEN_TRADE`: **the target book's
`expected_asset_class` must match the source's**, and the target must be active. Books are the
authority for asset class (a 6a contract), so the check is book-to-book rather than trade-by-trade —
a per-trade filter would silently move some trades and leave others, which is worse than refusing.

Only ACTIVE trades move. One `TRADE_REASSIGNED` audit row per moved trade carries `from_book_id`
and `to_book_id` in its payload and the caller's `client_request_id` as correlation, so a move of
N trades is reconstructable from the audit trail alone.

### 5. The blotter would not have noticed the move — and this was the real find

The plan assumed "the blotter picks the change up through its normal read path". It would not have.

The blotter serves ACTIVE trades from an in-memory `IndexedStore` **indexed by `book_id`**, filled
once at startup. `handle_valuation` inserts a trade only when it is *absent*; for one already
cached it just records the valuation. Nothing ever updates a cached field. After a move,
`/books/summary` counts and every `book_id` filter would have kept reporting the old book until the
service restarted — the screen would have shown the move as having silently failed.

The fix rides the stream that already exists. Pricing rebuilds its active set from the database
every 2 s, joining `books` for the name, so **the corrected `book_id` is already on the wire**. The
blotter now compares the streamed `book_id` against the cached one and re-indexes on disagreement.

The re-index is one atomic operation (`IndexedStore.update_field`) rather than remove-mutate-add
from the caller, for two reasons: the blotter serves requests on threads, and — subtler — the
naive version is simply wrong. `_add` removes an existing entry by reading the *stored* object's
field values; mutate the object first and the removal looks up the **new** book's index bucket,
leaving a stale entry under the old key forever.

**Design lesson worth keeping:** a denormalised cache is only as correct as its invalidation, and
"the field never changes" is an assumption that a later feature can quietly invalidate. This one
survived four phases before Flatten and reassignment made it false.

### 6. Flatten needed a `book_id` because close-all filtered on status alone

`close_all_trades(session, close_reason)` matched `status == 'ACTIVE'` and nothing else. Wiring the
mockup's per-book **Flatten** to it unchanged would have closed *every book's* trades — the single
most destructive bug this phase could have shipped. `book_id` is now an optional filter; omitted, the
global behaviour is byte-for-byte what it was, so the existing callers are untouched.

### 7. Flatten made the blotter's realized PnL visibly wrong, so that got fixed too

Bulk close writes no `close_price` — there is no per-trade price in a bulk SQL update. Pricing
handles that correctly: `finalize_closed_trades` marks the trade at the last valuation it wrote and
records the realized PnL with `marked_at_market: true`.

The blotter did not read that. `realized_pnl_by_book` computed realized PnL from
`close_price` and **skipped every trade where it was NULL**. So flattening a book with +11.89
unrealized would have shown unrealized drop to 0.00 and realized stay at 0.00 — the money simply
disappearing from the card. Nothing was wrong in the database; the screen just wasn't reading the
authoritative number.

This was invisible before because close-all was unreachable from the UI. The blotter now falls back
to the trade's latest valuation for prices it doesn't have, which is where pricing already put the
answer. Measured after a UI Flatten: unrealized 11.89 → 0.00, realized 0.00 → **10.66** (the two
positions drifted between the confirm and the close, which is what marking at market means).

### 8. Move is reachable through Delete, because that is what it is for

The mockup has no Move button, and the plan frames closing a book as *a move operation*: reassign,
then close the empty book. So `Delete` on a book with open positions does not show a refusal — it
opens the move dialog and explains why. Delete on a flat book goes straight to the confirm.

**The two steps are not chained automatically, and that is deliberate.** Trade-action answers `202
accepted` — the trades have not moved yet when the dialog closes. Auto-continuing to the delete
would race the worker and hit the guard we just built. The UI reports the acknowledgement, the 5 s
roster poll reconciles, and Delete becomes available once the card shows 0 open. Same ack-then-
reconcile shape as New Trade in 6b-1.

The trade-off, stated plainly: moving trades without intending to delete the book takes an extra
step. Given the mockup and the plan's framing, keeping one door is better than adding a fourth
button to a card that already has three.

## What changed during the build

- **Two fixes beyond the approved scope**, both caused by features in this phase and both recorded
  above: the blotter cache re-index (decision 5) and the realized-PnL fallback (decision 7).
  Neither is optional — the first makes reassignment appear to fail, the second makes Flatten hide
  money.
- **`is_active` was not in `/books/summary`.** The roster is built from that endpoint, so a deleted
  book had no way to leave the screen. One additive field, filtered client-side; the blotter keeps
  returning inactive books because their closed trades still need a name.
- **`ApiError` gained `body`.** The delete refusal carries the open-trade count, and repeating a
  number the client already has would go stale between poll and click. The 6b-1 contract holds —
  status codes stay diagnostic and the copy is ours — but a *reason* from the server is not a
  status code.
- **Trade Actions had to learn the new event.** Its feed filters to an explicit event-type list, so
  `TRADE_REASSIGNED` would have been invisible on the screen whose job is showing every trade
  mutation.

## Mental model: what owns what

```
  books-service ─── DELETE /books/{id} ──┐
                    PUT (is_active:false)│ guard: blotter says 0 ACTIVE?
                                         ├──> 409 has open trades
                    blotter_client ──────┘    503 could not verify (fail closed)
                         │ GET /trades?book_id&status=ACTIVE
                         ▼
  blotter-service ── owns trade reads ── IndexedStore[book_id] ──> /books/summary
                         ▲                      ▲
                         │                      │ re-index on book_id change
  pricing SSE ───────────┴──────────────────────┘ (active set re-read every 2s)

  trade-action-service ── the only writer of `trades`
       OPEN_TRADE · CLOSE_TRADE · CLOSE_ALL(book_id?) · REASSIGN_TRADES
                    └─ audit row per affected trade, correlated by client_request_id
```

books owns *which books exist*; the blotter owns *what is in them*; trade-action owns *every trade
mutation*. books-service asks rather than reads, and refuses when it cannot ask.

## Process flow: retiring a book that still holds positions

Delete on a card with open positions → the move dialog opens naming the count and the reason →
target list is filtered to *active books of the same asset class* → submit posts `REASSIGN_TRADES`
→ `202 accepted`, the dialog closes, the page shows the acknowledgement → the worker validates both
books, updates the ACTIVE rows and writes one `TRADE_REASSIGNED` per trade → pricing's 2 s refresh
picks up the new `book_id` and keeps valuing without a gap → the next valuation event carries the
new book, and the blotter re-indexes → the 5 s roster poll shows 0 open on the source and N open on
the target → Delete now opens the confirm → `DELETE /books/{id}`, the guard sees zero open trades,
the book leaves the roster and its closed trades keep their history.

## Honest gaps

- **A moved trade that is never valued never re-indexes.** The blotter learns about the move from
  the valuation stream, so a position whose symbol has no live price would stay in the old book's
  count until the blotter restarts. Every symbol in the catalog ticks, so this does not occur in
  practice — but the correction path is the stream, not the database.
- **Flattened trades have no close price.** They are marked at the last valuation, which is what
  `marked_at_market` records. The realized number is right; there is no single execution price to
  show, because there was no execution.
- **A rejected reassignment is audited against the book, not a trade.** The Trade Actions feed shows
  a book UUID in the id column for that one row. The message says which action was rejected, but the
  column is otherwise trade ids.
- **The audit list endpoint does not project `payload`.** `from_book_id`/`to_book_id` are written and
  queryable in the database, but `GET /audits` does not return them, so the feed shows the names
  from the message text rather than the ids.

## Verification performed

Against the live stack, on a freshly migrated database:

- **Delete guard:** `DELETE` on a book with 3 open trades → `409 {"error": "book has open trades",
  "active_trades": 3}`. The same book after the move and flatten → `200`, `is_active: false`.
  Unknown book → `404`.
- **Bypass closed:** `PUT {"is_active": false}` on that same book → the identical `409`.
- **Fails closed:** with `blotter-service` stopped, `DELETE` on a book with **zero** open trades →
  `503 {"error": "open trades could not be verified"}` in 0.04 s (refused, not hung).
- **Reassignment:** EQUITY → FX target rejected (`rejected` counter 0 → 1, no rows touched); EQUITY
  → EQUITY moved 3 trades, `reassigned` 0 → 3, three `TRADE_REASSIGNED` audit rows correlated to
  `manual-move-good`, payload `{"from_book_id": …, "to_book_id": …}` confirmed in the database.
- **Blotter follows without a restart:** source `active=3 → 0`, target `active=0 → 3`, three
  `trade_reindexed` log lines. The closed trade stayed on the source (`closed=1`,
  `realized=5.20`).
- **Valuation survives the move:** all three moved trades kept returning `source:
  valuation-stream` fair values immediately after the move (1108.47 / 1209.24 / 1310.01), and the
  target card's unrealized went on ticking (+4.51 → +11.89).
- **Flatten is scoped:** flattening one EQUITY book closed its 3 trades; the FX control book kept
  its open position throughout. Verified twice — once over HTTP, once through the UI.
- **Realized PnL survives the flatten:** unrealized 11.89 → 0.00 with realized 0.00 → **10.66**
  (before the blotter fix this read 0.00).
- **UI end to end:** Delete on a book with 2 open positions opened the move dialog; the move
  produced *"Accepted — 2 open positions are moving to UI Target EQ."*; the roster reconciled to
  0 open; Delete then opened the confirm and the roster went 9 books → 8 with the EQUITY filter
  count 4 → 3. `TRADE_REASSIGNED` rows render on Trade Actions as `REASSIGNED` with
  *"Trade moved from UI Source EQ to UI Target EQ"*.
- `npm run lint` / `build` / `deadcode` clean. `apiDelete` came off the accepted-knip list as
  planned; `ApiError` stays (it is the exported type, used via `instanceof` nowhere yet).

## Concepts seen for the first time in this phase

- **Fail closed.** A precondition that cannot be evaluated is not a precondition that passed. The
  interesting case is not "the blotter said no" but "the blotter said nothing", and the two must
  produce different answers to the user, which is why the refusals carry different status codes.
- **Guard the transition, not the route.** The same state change was reachable from two endpoints.
  Rules attached to a URL leak; rules attached to the transition don't.
- **Cache invalidation by disagreement.** Rather than pushing an invalidation message when a book
  changes, the blotter notices that the stream and its cache disagree and corrects itself. No new
  channel, no coordination, and it self-heals after a missed message — but it is only as timely as
  the stream that carries the truth.
- **Asynchronous writes cannot be chained in the UI.** `202 accepted` means enqueued, not done. Any
  flow whose second step depends on the first step's *effect* has to reconcile by polling, not by
  continuing on the acknowledgement.

## Files for first-pass review

`shared/enums.py` → `services/books-service/app/{config,blotter_client,api}.py` (the guard) →
`services/trade-action-service/app/{repository,trade_processor}.py` (`REASSIGN_TRADES`, scoped
close-all) → `services/blotter-service/app/{cache,service}.py` (the re-index) →
`services/blotter-service/app/repository.py` (realized-PnL fallback) → `domain/books.js`
(`moveTargetsOf`) + `domain/tradeActions.js` (the two new intents) →
`components/ConfirmDialog.jsx` → `components/books/MoveTradesDialog.jsx` →
`views/Books/Books.jsx`.

## Known limits

- All three dialogs are still `<dialog showModal()>` overlays. 6c replaces them with the one shared
  push-aside panel.
- Flatten and Delete are per-book only; there is no multi-select.
- The blotter re-index depends on the valuation stream, as described in the gaps.
- `realized_pnl_by_book` still loads every closed trade on each 5 s poll and now issues one extra
  query for price-less closes. Correct, and unchanged in shape from before this phase, but it is the
  next thing to feel the generator's volume.
</content>
