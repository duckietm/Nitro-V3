import {
    ISoundboardSound,
    GetSessionDataManager,
    loadGamedata,
    SoundboardPlayComposer,
    SoundboardPlayEvent,
    SoundboardSetEnabledComposer,
    SoundboardSettingsEvent
} from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { DispatchUiEvent, GetConfigurationValue, SendMessageComposer, setSoundboardRoomEnabled } from '../../api';
import { SoundboardRoomMessageEvent } from '../../events';
import { useMessageEvent } from '../events';
import { getRemainingCooldownSeconds, shouldStartOwnCooldown } from './soundboardUi.helpers';

// A pad as the client uses it. `local` marks pads that came from the JSON5 file
// fallback rather than the server (DB) — those play locally on click because the
// server can't resolve their id to broadcast them.
export type ClientSoundboardSound = ISoundboardSound & { local?: boolean };

const playLocal = (url: string) => {
    if (!url) return;
    try {
        const audio = new Audio(url);
        audio.volume = 0.8;
        void audio.play().catch(() => {});
    } catch {}
};

// Resolve a stored sound url (which may be relative, like custom badges) to an
// absolute one against the asset host.
const resolveUrl = (url: string): string => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('//') || url.startsWith('/')) return url;

    const base = (GetConfigurationValue<string>('soundboard.url.prefix') || GetConfigurationValue<string>('asset.url') || '').replace(/\/+$/, '');
    return base ? `${base}/${url.replace(/^\/+/, '')}` : url;
};

// Soundboard state + actions. Shared via useBetween so the event listeners
// register once regardless of how many components read it (toolbar + view).
const useSoundboardState = () => {
    const [enabled, setEnabled] = useState(false);
    const [serverSounds, setServerSounds] = useState<ISoundboardSound[]>([]);
    const [fileSounds, setFileSounds] = useState<ClientSoundboardSound[]>([]);
    const [lastPlayed, setLastPlayed] = useState<{ soundId: number; username: string } | null>(null);
    const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);
    const fileLoadStartedRef = useRef(false);
    const cooldownSecondsRef = useRef(60);
    const cooldownUntilRef = useRef(0);
    const localFallbackEnabled = GetConfigurationValue<boolean>('soundboard.localFallback.enabled', false);

    const handleSettings = useCallback((event: SoundboardSettingsEvent) => {
        const parser = event.getParser();
        cooldownSecondsRef.current = Math.max(0, parser.cooldownSeconds);
        setEnabled(parser.enabled);
        setServerSounds(parser.sounds);
        setSoundboardRoomEnabled(parser.enabled);
    }, []);

    useMessageEvent<SoundboardSettingsEvent>(SoundboardSettingsEvent, handleSettings);

    const handlePlay = useCallback((event: SoundboardPlayEvent) => {
        const parser = event.getParser();
        playLocal(resolveUrl(parser.url));
        setLastPlayed({ soundId: parser.soundId, username: parser.username });
        DispatchUiEvent(new SoundboardRoomMessageEvent(parser.username, parser.soundName, parser.actorUserId, parser.actorRoomIndex));

        const sessionDataManager = GetSessionDataManager();
        const ownUserId = sessionDataManager?.getUserDataSnapshot?.().userId || -1;
        if (shouldStartOwnCooldown(parser.actorUserId, ownUserId)) {
            const now = Date.now();
            cooldownUntilRef.current = now + cooldownSecondsRef.current * 1_000;
            setCooldownRemainingSeconds(getRemainingCooldownSeconds(cooldownUntilRef.current, now));
        }
    }, []);

    useMessageEvent<SoundboardPlayEvent>(SoundboardPlayEvent, handlePlay);

    const isCoolingDown = cooldownRemainingSeconds > 0;

    useEffect(() => {
        if (!isCoolingDown) return;

        const updateRemaining = () => setCooldownRemainingSeconds(getRemainingCooldownSeconds(cooldownUntilRef.current, Date.now()));
        const timer = window.setInterval(updateRemaining, 250);

        return () => window.clearInterval(timer);
    }, [isCoolingDown]);

    // Fallback: when the soundboard is on but the server (DB) provided no pads,
    // load them from the JSON5 file once. loadGamedata accepts plain JSON and
    // JSON5 (// comments) — same loader used for the avatar effect map.
    useEffect(() => {
        if (!localFallbackEnabled || !enabled || serverSounds.length || fileLoadStartedRef.current) return;
        fileLoadStartedRef.current = true;

        const url =
            GetConfigurationValue<string>('soundboard.url') ||
            GetConfigurationValue<string>('soundboard.sounds.url') ||
            'configuration/soundboard-sounds.json5';

        (async () => {
            try {
                const json = await loadGamedata<{ sounds?: ISoundboardSound[] }>(url);
                const list = Array.isArray(json?.sounds)
                    ? json.sounds.filter((s) => s && s.url).map((s) => ({ id: s.id, name: s.name, url: s.url, local: true }))
                    : [];
                setFileSounds(list);
            } catch {}
        })();
    }, [enabled, localFallbackEnabled, serverSounds.length]);

    const sounds: ClientSoundboardSound[] = serverSounds.length ? serverSounds : localFallbackEnabled ? fileSounds : [];

    const play = useCallback((sound: ClientSoundboardSound) => {
        if (!sound || getRemainingCooldownSeconds(cooldownUntilRef.current, Date.now()) > 0) return;
        // File-defined pad: the server doesn't know it, so play it locally.
        if (sound.local) {
            playLocal(resolveUrl(sound.url));
            return;
        }
        // DB-backed pad: let the server broadcast it to everyone in the room.
        SendMessageComposer(new SoundboardPlayComposer(sound.id));
    }, []);

    const setRoomEnabled = useCallback((value: boolean) => {
        setEnabled(value);
        setSoundboardRoomEnabled(value);
        SendMessageComposer(new SoundboardSetEnabledComposer(value));
    }, []);

    // Local-only clear (e.g. when leaving the room) — does not notify the server.
    const reset = useCallback(() => {
        setEnabled(false);
        setServerSounds([]);
        setFileSounds([]);
        setLastPlayed(null);
        setCooldownRemainingSeconds(0);
        cooldownUntilRef.current = 0;
        cooldownSecondsRef.current = 60;
        fileLoadStartedRef.current = false;
        setSoundboardRoomEnabled(false);
    }, []);

    return { enabled, sounds, lastPlayed, cooldownRemainingSeconds, isCoolingDown, play, setRoomEnabled, reset };
};

export const useSoundboard = () => useBetween(useSoundboardState);
