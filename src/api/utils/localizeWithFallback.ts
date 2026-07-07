import { LocalizeText } from './LocalizeText';

/**
 * Pure decision: the localization manager returns the key itself for a missing
 * translation, so treat "text equals the key" (or empty) as "no translation"
 * and use the fallback instead.
 */
export const resolveLocalized = (localized: string, key: string, fallback: string): string => (localized && localized !== key ? localized : fallback);

/**
 * Localize `key`, returning `fallback` when the key has no translation
 * (so raw keys never surface in the UI). Optional `parameters` / `replacements`
 * are forwarded to `LocalizeText` for keys that contain placeholders.
 */
export const localizeWithFallback = (
    key: string,
    fallback: string,
    parameters: string[] = null,
    replacements: string[] = null,
): string => resolveLocalized(LocalizeText(key, parameters, replacements), key, fallback);
