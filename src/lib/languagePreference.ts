/**
 * Shared language resolution for the store and the landing page.
 *
 * The two halves used to disagree: the landing page defaulted to English and
 * saved under "manajel-lang", while the store defaulted to Arabic and saved
 * under "manajel-language" — so a visitor's choice never carried across, and an
 * Arabic speaker arriving from an Arabic Google search landed on English.
 *
 * Rules, in order:
 *   1. An explicit choice the visitor made is always honoured.
 *   2. Otherwise the browser/phone language decides (Arabic → ar).
 *   3. Otherwise English.
 *
 * This runs in the browser only. Crawlers read the server-rendered HTML, so
 * indexing is unaffected.
 */

export type SiteLanguage = "ar" | "en";

export const LANGUAGE_STORAGE_KEY = "manajel-language";
/** Older key written by the landing page; still read so returning visitors keep their choice. */
export const LEGACY_LANGUAGE_STORAGE_KEY = "manajel-lang";

function isLanguage(value: unknown): value is SiteLanguage {
  return value === "ar" || value === "en";
}

/** The visitor's saved choice, or null if they have not chosen yet. */
export function getStoredLanguage(): SiteLanguage | null {
  try {
    const current = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(current)) return current;

    const legacy = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    if (isLanguage(legacy)) {
      // Migrate so both halves of the site agree from now on.
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, legacy);
      } catch {
        // storage full or blocked — reading still worked, that is enough
      }
      return legacy;
    }
  } catch {
    // private mode / storage disabled
  }
  return null;
}

/** Arabic when the browser or phone is set to Arabic, otherwise English. */
export function getBrowserLanguage(): SiteLanguage {
  try {
    const candidates =
      Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];

    for (const tag of candidates) {
      if (typeof tag !== "string") continue;
      const primary = tag.toLowerCase().split("-")[0];
      if (primary === "ar") return "ar";
      if (primary === "en") return "en";
    }
  } catch {
    // navigator unavailable
  }
  return "en";
}

/** Saved choice if there is one, otherwise the browser language. */
export function resolveInitialLanguage(): SiteLanguage {
  return getStoredLanguage() ?? getBrowserLanguage();
}

export function storeLanguage(lang: SiteLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Keep the legacy key in step so the static landing page agrees.
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}
