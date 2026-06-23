import {
    ISoundboardSound,
    loadGamedata,
    SoundboardPlayComposer,
    SoundboardPlayEvent,
    SoundboardSetEnabledComposer,
    SoundboardSettingsEvent
} from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { GetConfigurationValue, SendMessageComposer, setSoundboardRoomEnabled } from '../../api';
import { useMessageEvent } from '../events';

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
    const fileLoadStartedRef = useRef(false);

    useMessageEvent<SoundboardSettingsEvent>(SoundboardSettingsEvent, (event) => {
        const parser = event.getParser();
        setEnabled(parser.enabled);
        setServerSounds(parser.sounds);
        setSoundboardRoomEnabled(parser.enabled);
    });

    useMessageEvent<SoundboardPlayEvent>(SoundboardPlayEvent, (event) => {
        const parser = event.getParser();
        playLocal(resolveUrl(parser.url));
        setLastPlayed({ soundId: parser.soundId, username: parser.username });
    });

    // Fallback: when the soundboard is on but the server (DB) provided no pads,
    // load them from the JSON5 file once. loadGamedata accepts plain JSON and
    // JSON5 (// comments) — same loader used for the avatar effect map.
    useEffect(() => {
        if (!enabled || serverSounds.length || fileLoadStartedRef.current) return;
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
    }, [enabled, serverSounds.length]);

    const sounds: ClientSoundboardSound[] = serverSounds.length ? serverSounds : fileSounds;

    const play = useCallback((sound: ClientSoundboardSound) => {
        if (!sound) return;
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
        setLastPlayed(null);
        setSoundboardRoomEnabled(false);
    }, []);

    return { enabled, sounds, lastPlayed, play, setRoomEnabled, reset };
};

export const useSoundboard = () => useBetween(useSoundboardState);
