declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = (((import.meta as any).env?.VITE_GA_MEASUREMENT_ID) as string) || '';

/**
 * Initializes Google Analytics (gtag.js) script dynamically if measurement ID is present.
 */
export function initGA(measurementId: string = GA_MEASUREMENT_ID) {
  if (!measurementId || typeof window === 'undefined') {
    return;
  }

  // Avoid injecting script twice
  if (document.getElementById('ga-gtag-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true,
  });

  console.log(`[Google Analytics] Initialized with ID: ${measurementId}`);
}

/**
 * Tracks a page or screen view in Google Analytics
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (!window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle || pagePath,
  });
}

/**
 * Tracks a custom event in Google Analytics
 */
export function trackEvent(action: string, category?: string, label?: string, value?: number) {
  if (!window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}
