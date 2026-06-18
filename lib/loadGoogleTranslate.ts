/**
 * On-demand loader for the Google Translate element widget — ported 1:1 from the
 * main feedcast.news app so markets.feedcast.news behaves identically.
 *
 * The default English visitor never uses Translate, so the 320 KiB element.js is
 * injected only the first time a user actually picks a non-English language; the
 * script is fetched once per session and reused for subsequent changes.
 */

type TranslateGlobal = {
  google?: {
    translate?: {
      TranslateElement?: new (
        options: { pageLanguage: string; autoDisplay?: boolean },
        elementId: string,
      ) => unknown;
    };
  };
  googleTranslateElementInit?: () => void;
};

let loadPromise: Promise<void> | null = null;

/** Resolves once google.translate.TranslateElement is constructed. */
export function loadGoogleTranslate(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as unknown as TranslateGlobal;
  if (w.google?.translate?.TranslateElement) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Mount target — created on first call so the SSR HTML never ships
    // this empty <div> for users who don't translate.
    if (!document.getElementById('google_translate_element')) {
      const mount = document.createElement('div');
      mount.id = 'google_translate_element';
      mount.setAttribute('aria-hidden', 'true');
      document.body.appendChild(mount);
    }

    w.googleTranslateElementInit = () => {
      try {
        const T = w.google?.translate?.TranslateElement;
        if (!T) {
          reject(new Error('TranslateElement missing after script load'));
          return;
        }
        new T(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element',
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    const script = document.createElement('script');
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Translate script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
