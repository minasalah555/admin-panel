/** Served from Vite `public/` — used when an image fails to load */
export const PLACEHOLDER_PATH = '/placeholder.svg';

const PLACEHOLDER_REMOTE = 'https://placehold.co/72x72/e2e8f0/64748b?text=+';

/**
 * Laravel app origin (no trailing slash, no /api). Prefer VITE_BACKEND_ORIGIN when API and assets differ.
 */
export function getBackendOrigin() {
  const explicit = import.meta.env.VITE_BACKEND_ORIGIN;
  if (explicit) {
    return String(explicit).replace(/\/$/, '');
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  return apiBase.replace(/\/api\/?$/, '');
}

/**
 * Resolve product/category image URL for <img src>. Handles absolute URLs and /storage/... paths from Laravel.
 */
export function resolveMediaUrl(url) {
  if (!url) return PLACEHOLDER_PATH;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = getBackendOrigin();
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${path}`;
}

/**
 * Props to spread on <img> for graceful fallback when URL is wrong or file missing.
 */
export function imageFallbackProps() {
  return {
    onError: (e) => {
      const el = e.currentTarget;
      if (el.dataset.fallbackApplied === '1') return;
      el.dataset.fallbackApplied = '1';
      el.src = PLACEHOLDER_PATH;
      el.onerror = () => {
        el.src = PLACEHOLDER_REMOTE;
      };
    },
  };
}
