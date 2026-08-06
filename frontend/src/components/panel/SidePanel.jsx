import { useId, useRef } from 'react'
import { usePanelChrome } from '../../hooks/usePanelChrome.js'
import { usePanelCoordinator } from '../../layout/panelContext.js'
import Icon from '../Icon.jsx'

export default function SidePanel({
  eyebrow,
  title,
  subtitle,
  headActions,
  notice,
  tabs,
  footer,
  wide = false,
  onClose,
  children,
}) {
  const panelRef = useRef(null)
  const titleId = useId()
  const { switchingPanel } = usePanelCoordinator()
  const suppressEntryAnimation = useRef(switchingPanel)

  usePanelChrome(panelRef, onClose)

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`side-panel${wide ? ' side-panel--wide' : ''}${
        suppressEntryAnimation.current ? ' side-panel--no-enter' : ''
      }`}
    >
      <header className="side-panel__head">
        <div className="side-panel__heading">
          <div className="side-panel__title-row">
            <h2 id={titleId} tabIndex={-1} data-panel-initial-focus>{title}</h2>
            {eyebrow && <span className="side-panel__eyebrow">{eyebrow}</span>}
          </div>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="side-panel__head-actions">
          {headActions}
          <button
            type="button"
            className="side-panel__close"
            aria-label="Close panel"
            onClick={onClose}
          >
            <Icon name="close" className="side-panel__close-icon" />
          </button>
        </div>
      </header>

      {notice}
      {tabs}

      <div className="side-panel__body">{children}</div>

      {footer && <footer className="side-panel__footer">{footer}</footer>}
    </aside>
  )
}
