'use client';

type UXEventName =
  | 'help_opened'
  | 'help_sheet_opened'
  | 'help_tour_started'
  | 'help_tour_completed'
  | 'coachmark_opened'
  | 'coachmark_completed'
  | 'node_created'
  | 'node_edited'
  | 'connect_started'
  | 'connect_completed'
  | 'resize_completed'
  | 'viewport_zoom_in'
  | 'viewport_zoom_out'
  | 'viewport_fit'
  | 'pane_pan_started'
  | 'pane_pan_completed'
  | 'mis_tap_connect_cancelled'
  | 'action_sheet_opened'
  | 'map_viewed_as_viewer'
  | 'edit_blocked_not_owner'
  | 'delete_blocked_not_owner'
  | 'share_link_copied_viewer';

export function trackUXEvent(name: UXEventName, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const detail = { name, payload, ts: Date.now() };
  window.dispatchEvent(new CustomEvent('ff:ux-event', { detail }));

  if (process.env.NODE_ENV !== 'production') {
    // Dev-only breadcrumb until product analytics is wired.
    console.debug('[ff:ux-event]', detail);
  }
}
