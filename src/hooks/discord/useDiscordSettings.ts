import { useCallback } from 'react';
import { useLocalStorage } from '../useLocalStorage';

/**
 * Client-side model of the Discord Rich Presence preferences.
 *
 * Ported from the Flash client's `DiscordPreferences` value object
 * (`com.sulake.habbo.discord.settings`). The original synced these with the
 * server through the Discord preference composer/parser pair; that networking
 * layer lives in the renderer SDK and is intentionally NOT used here — this
 * hook keeps the preferences purely on the client (localStorage), so the panel
 * works standalone. Wire it to a composer later if/when the renderer exposes
 * the Discord packets.
 */
export interface DiscordPreferences {
    /** Show the Habbo Rich Presence on the user's Discord profile (master toggle). */
    showHabbo: boolean;
    /** Share what the user is doing (room name / activity) in the presence. */
    shareActivity: boolean;
    /** Hide room details while in a hidden room. */
    hideInHiddenRooms: boolean;
    /** Expose a "Visit room" join button on the presence. */
    allowJoining: boolean;
}

export const DISCORD_PREFERENCES_DEFAULT: DiscordPreferences = {
    showHabbo: true,
    shareActivity: true,
    hideInHiddenRooms: true,
    allowJoining: true,
};

const STORAGE_KEY = 'nitro.discord.preferences';

export const useDiscordSettings = () => {
    const [preferences, setPreferences] = useLocalStorage<DiscordPreferences>(
        STORAGE_KEY,
        DISCORD_PREFERENCES_DEFAULT,
    );

    const updatePreferences = useCallback(
        (partial: Partial<DiscordPreferences>) => {
            setPreferences((prev) => ({ ...prev, ...partial }));
        },
        [setPreferences],
    );

    const resetPreferences = useCallback(() => {
        setPreferences(DISCORD_PREFERENCES_DEFAULT);
    }, [setPreferences]);

    return { preferences, updatePreferences, resetPreferences };
};
