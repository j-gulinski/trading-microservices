import { useState } from 'react'
import { usePolling } from '../../hooks/usePolling.js'
import { useElapsedTime } from '../../hooks/useElapsedTime.js'
import { useValuationFeedContext } from '../../providers/feedContext.js'
import { apiDelete, apiGet, apiPost } from '../../services/apiClient.js'
import { endpoints } from '../../services/endpoints.js'
import { BOOK_SUMMARY_POLL_INTERVAL_MS } from '../../config/books.js'
import {
  bookPositionsOf,
  bookSummariesOf,
  moveTargetsOf,
  summarizeBooks,
} from '../../domain/books.js'
import { buildFlattenIntent } from '../../domain/tradeActions.js'
import { describeApiError } from '../../domain/apiErrors.js'
import { positionsOf, valuationRowsOf } from '../../domain/valuations.js'
import { countOptions } from '../../domain/filters.js'
import { formatNumber } from '../../domain/formatting.js'
import EmptyState from '../../components/EmptyState.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import FilterBar from '../../components/filters/FilterBar.jsx'
import BookCard from '../../components/books/BookCard.jsx'
import BookFormDialog from '../../components/books/BookFormDialog.jsx'
import MoveTradesDialog from '../../components/books/MoveTradesDialog.jsx'

function describeDeleteError(error) {
  if (error?.status === 409) {
    const open = Number(error.body?.active_trades)
    return Number.isFinite(open)
      ? `Refused — this book still has ${formatNumber(open)} open ${
          open === 1 ? 'position' : 'positions'
        }.`
      : 'Refused — this book still has open positions.'
  }
  if (error?.status === 503 && error.body?.error === 'open trades could not be verified') {
    return 'Blotter service unavailable — open positions could not be checked, so nothing was deleted.'
  }
  return describeApiError(error, {
    service: 'Books service',
    outcome: 'the book was not deleted.',
  })
}

export default function Books() {
  const summary = usePolling(
    ({ signal }) => apiGet(endpoints.blotter.booksSummary, { signal }),
    { intervalMs: BOOK_SUMMARY_POLL_INTERVAL_MS },
  )
  const { valuations } = useValuationFeedContext()
  const { now } = useElapsedTime()

  const [expandedId, setExpandedId] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState(null)
  const [activeClass, setActiveClass] = useState(null)
  const [query, setQuery] = useState('')

  const allBooks = bookSummariesOf(summary.data).filter((book) => book.isActive)
  const totals = summarizeBooks(allBooks)
  const search = query.trim().toLowerCase()
  const books = allBooks.filter(
    (book) =>
      (!activeClass || book.assetClass === activeClass) &&
      (!search || book.name.toLowerCase().includes(search)),
  )
  const positions =
    expandedId == null
      ? []
      : bookPositionsOf(
          positionsOf(valuationRowsOf(Object.values(valuations), now)),
          expandedId,
        )

  const target = dialog?.bookId ? allBooks.find((book) => book.id === dialog.bookId) : null
  const unavailable = summary.error != null && summary.data == null

  function openAction(type, book) {
    setNotice(null)
    setDialog({ type, bookId: book.id })
  }

  function acknowledge(message) {
    setNotice(message)
    summary.refetch()
  }

  let content
  if (summary.loading) {
    content = <EmptyState message="Loading books…" />
  } else if (unavailable) {
    content = (
      <EmptyState message="Blotter service unavailable — retrying." />
    )
  } else if (allBooks.length === 0) {
    content = <EmptyState message="No books yet — create the first one." />
  } else if (books.length === 0) {
    content = <EmptyState message="No books match these filters." />
  } else {
    content = (
      <div className="books-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            expanded={expandedId === book.id}
            positions={expandedId === book.id ? positions : []}
            onToggleExpand={() =>
              setExpandedId((current) => (current === book.id ? null : book.id))
            }
            onEdit={() => openAction('edit', book)}
            onFlatten={() => openAction('flatten', book)}
            onDelete={() => openAction(book.activeTrades > 0 ? 'move' : 'delete', book)}
          />
        ))}
      </div>
    )
  }

  return (
    <section className="page">
      <div className="books-header">
        <span className="books-header__meta">
          {formatNumber(totals.books)} books · {formatNumber(totals.openPositions)} open
          positions
        </span>
        <button
          type="button"
          className="books-button books-button--accent"
          onClick={() => {
            setNotice(null)
            setDialog({ type: 'create' })
          }}
        >
          + Create book
        </button>
      </div>

      <FilterBar
        label="CLASS"
        ariaLabel="Filter books by asset class"
        options={countOptions(allBooks, (book) => book.assetClass)}
        value={activeClass}
        onChange={setActiveClass}
        search={{
          label: 'BOOK',
          value: query,
          onChange: setQuery,
          placeholder: 'Search book name…',
        }}
      />

      {summary.error != null && summary.data != null && (
        <div className="blotter-notice" role="status">
          Book list refresh failed — showing the last available data.
        </div>
      )}

      {notice && (
        <div className="blotter-notice blotter-notice--ok" role="status">
          {notice}
        </div>
      )}

      {content}

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <BookFormDialog
          bookId={dialog.type === 'edit' ? dialog.bookId : null}
          onSaved={summary.refetch}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === 'move' && target != null && (
        <MoveTradesDialog
          book={target}
          targets={moveTargetsOf(allBooks, target)}
          onAccepted={acknowledge}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === 'flatten' && target != null && (
        <ConfirmDialog
          eyebrow="BOOKS"
          title="Flatten book"
          subtitle={target.name}
          message={`Close all ${formatNumber(target.activeTrades)} open ${
            target.activeTrades === 1 ? 'position' : 'positions'
          } in this book. Each one closes at its last valued price, and the realized PnL stays here.`}
          confirmLabel="Flatten book"
          onConfirm={async () => {
            await apiPost(endpoints.tradeAction.closeAll, buildFlattenIntent(target.id))
            acknowledge(
              `Accepted — ${formatNumber(target.activeTrades)} ${
                target.activeTrades === 1 ? 'position is' : 'positions are'
              } closing in ${target.name}.`,
            )
          }}
          describeError={(error) =>
            describeApiError(error, {
              service: 'Trade-action service',
              outcome: 'nothing was closed.',
            })
          }
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === 'delete' && target != null && (
        <ConfirmDialog
          eyebrow="BOOKS"
          title="Delete book"
          subtitle={target.name}
          message={
            target.closedTrades > 0
              ? `This book stops accepting trades and leaves the roster. Its ${formatNumber(
                  target.closedTrades,
                )} closed ${
                  target.closedTrades === 1 ? 'trade keeps its' : 'trades keep their'
                } history here.`
              : 'This book stops accepting trades and leaves the roster.'
          }
          confirmLabel="Delete book"
          onConfirm={async () => {
            await apiDelete(endpoints.books.book(target.id))
            acknowledge(`${target.name} deleted.`)
          }}
          describeError={describeDeleteError}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  )
}
