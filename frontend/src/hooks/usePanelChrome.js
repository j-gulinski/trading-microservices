import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function usePanelChrome(panelRef, onClose) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const panel = panelRef.current
    if (panel == null) return undefined
    const previouslyFocused = document.activeElement
    const inertTargets = [
      ...Array.from(panel.parentElement?.children ?? []).filter((node) => node !== panel),
      panel.closest('.app-shell')?.querySelector('.sidebar'),
    ].filter(Boolean)
    const inertState = inertTargets.map((node) => ({
      node,
      hadInert: node.hasAttribute('inert'),
      ariaHidden: node.getAttribute('aria-hidden'),
    }))

    inertTargets.forEach((node) => {
      node.setAttribute('inert', '')
      node.setAttribute('aria-hidden', 'true')
    })

    const focusFrame = requestAnimationFrame(() => {
      const initialFocus = panel.querySelector('[data-panel-initial-focus]')
      if (initialFocus instanceof HTMLElement) initialFocus.focus()
    })

    function handlePointerDown(event) {
      if (panel.contains(event.target)) return
      if (event.target instanceof Element && event.target.closest('[data-panel-trigger]')) return
      onCloseRef.current()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (node) => node instanceof HTMLElement && node.getClientRects().length > 0,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (
        event.shiftKey &&
        (active === first || active === panel.querySelector('[data-panel-initial-focus]'))
      ) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      inertState.forEach(({ node, hadInert, ariaHidden }) => {
        if (!hadInert) node.removeAttribute('inert')
        if (ariaHidden == null) node.removeAttribute('aria-hidden')
        else node.setAttribute('aria-hidden', ariaHidden)
      })
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        requestAnimationFrame(() => previouslyFocused.focus())
      }
    }
  }, [panelRef])
}
