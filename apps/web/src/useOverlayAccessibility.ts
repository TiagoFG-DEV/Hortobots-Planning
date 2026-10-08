import { useEffect } from 'react';

// All overlay variants share keyboard behavior and return focus to their trigger.
export function useOverlayAccessibility() {
  useEffect(() => {
    const selector = '.menu-layer.open, .dialog-layer, .focus-layer, .hb-dialog-overlay';
    const focusable = 'button, a[href], input, select, textarea, [tabindex="0"]';
    let active: HTMLElement | null = null;
    let previous: HTMLElement | null = null;
    const targets = () => active ? Array.from(active.querySelectorAll<HTMLElement>(focusable))
      .filter(el => !el.matches(':disabled') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden') : [];
    const sync = () => {
      const overlays = document.querySelectorAll<HTMLElement>(selector);
      const next = overlays.item(overlays.length - 1);
      if (next === active) return;
      if (!next) {
        active = null;
        if (previous?.isConnected) previous.focus({ preventScroll: true });
        previous = null;
        return;
      }
      if (!active) previous = document.activeElement as HTMLElement;
      active = next;
      active.setAttribute('role', 'dialog');
      active.setAttribute('aria-modal', 'true');
      active.setAttribute('aria-label', active.matches('.menu-layer') ? 'Navegação' : active.matches('.focus-layer') ? 'Visualização de mídia' : 'Diálogo');
      active.tabIndex = -1;
      (targets()[0] || active).focus({ preventScroll: true });
    };
    const onKey = (event: KeyboardEvent) => {
      if (!active) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        active.click();
      } else if (event.key === 'Tab') {
        const items = targets();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) { event.preventDefault(); active.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) {
          event.preventDefault(); (last || first).focus();
        } else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.getElementById('root')!, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    document.addEventListener('keydown', onKey);
    sync();
    return () => { observer.disconnect(); document.removeEventListener('keydown', onKey); };
  }, []);
}
