export default function TopBar({ route, onNewTrade }) {
  return (
    <header className="topbar">
      <div className="topbar__heading">
        <h1 className="topbar__title">{route.label}</h1>
        <div className="topbar__context">
          <span className="topbar__environment">SIM</span>
          <span className="topbar__subtitle">{route.subtitle}</span>
        </div>
      </div>
      <button
        type="button"
        className="topbar__action"
        data-panel-trigger
        onClick={onNewTrade}
      >
        New trade
      </button>
    </header>
  )
}
