import { LocalizeText } from './LocalizeText';

/**
 * Pure decision: the localization manager returns the key itself for a missing
 * translation, so treat "text equals the key" (or empty) as "no translation"
 * and use the fallback instead.
 */
export const resolveLocalized = (localized: string, key: string, fallback: string): string => (localized && localized !== key ? localized : fallback);

/**
 * Localize `key`, returning `fallback` when the key has no translation
 * (so raw keys never surface in the UI).
 */
export const localizeWithFallback = (key: string, fallback: string): string => resolveLocalized(LocalizeText(key), key, fallback);
