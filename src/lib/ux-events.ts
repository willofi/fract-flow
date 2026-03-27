'use client';

type UXEventName =
  | 'help_opened'
  | 'help_tour_started'
  | 'help_tour_completed'
  | 'node_created'
  | 'node_edited'
  | 'connect_started'
  | 'connect_completed'
  | 'resize_completed'
  | 'mis_tap_connect_cancelled'
  | 'action_sheet_opened';

export function trackUXEvent(name: UXEventName, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const detail = { name, payload, ts: Date.now() };
  window.dispatchEvent(new CustomEvent('ff:ux-event', { detail }));

  if (process.env.NODE_ENV !== 'production') {
    // Dev-only breadcrumb until product analytics is wired.
    console.debug('[ff:ux-event]', detail);
  }
}
