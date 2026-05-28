import { loadGamedata } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { GetConfigurationValue } from '../../api';

export type RadioStation = {
    id: string;
    name: string;
    genre?: string;
    url: string;
    logo?: string;
};

// Hotel radio: a list of streaming URLs played client-side with HTML5 Audio.
// The station list comes from a JSON5 config file (loadGamedata accepts plain
// JSON and JSON5). Shared via useBetween so playback is a single instance no
// matter how many components read it.
const useRadioState = () =>
{
    const [ stations, setStations ] = useState<RadioStation[]>([]);
    const [ currentId, setCurrentId ] = useState<string | null>(null);
    const [ isPlaying, setIsPlaying ] = useState(false);
    const [ loadError, setLoadError ] = useState<string | null>(null);
    const [ volume, setVolumeState ] = useState(0.05); // start quiet (5%) so autostart isn't intrusive
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const loadStartedRef = useRef(false);
    const autoStartedRef = useRef(false);

    useEffect(() =>
    {
        if(loadStartedRef.current) return;
        loadStartedRef.current = true;

        const url = GetConfigurationValue<string>('radio.stations.url') || 'configuration/radio-stations.json5';

        (async () =>
        {
            try
            {
                const json = await loadGamedata<{ stations?: RadioStation[] }>(url);
                const list = Array.isArray(json?.stations)
                    ? json.stations.filter(s => s && s.id && s.url)
                    : [];
                setStations(list);
            }
            catch(error)
            {
                setLoadError(String((error as Error)?.message ?? error));
            }
        })();
    }, []);

    // Tear down the stream when the hook instance goes away.
    useEffect(() => () =>
    {
        if(audioRef.current)
        {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
    }, []);

    const stop = useCallback(() =>
    {
        if(audioRef.current)
        {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        setIsPlaying(false);
        setCurrentId(null);
    }, []);

    // Browsers block audio that starts without a user gesture (autoplay policy),
    // so the startup autostart may be refused. When that happens, resume on the
    // very first click / keypress anywhere.
    const armResumeOnGesture = useCallback(() =>
    {
        const resume = () =>
        {
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
            if(audioRef.current) void audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
    }, []);

    const play = useCallback((station: RadioStation) =>
    {
        if(!station?.url) return;

        if(audioRef.current)
        {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }

        try
        {
            const audio = new Audio(station.url);
            audio.volume = volume;
            audioRef.current = audio;
            setCurrentId(station.id);
            void audio.play().then(() => setIsPlaying(true)).catch(() =>
            {
                // Likely autoplay-blocked — keep the station selected and resume
                // on the first user interaction instead of dropping it.
                setIsPlaying(false);
                armResumeOnGesture();
            });
        }
        catch
        {
            setIsPlaying(false);
            setCurrentId(null);
        }
    }, [ volume, armResumeOnGesture ]);

    // Autostart the first station once on client load (quiet, see initial volume).
    useEffect(() =>
    {
        if(autoStartedRef.current || !stations.length) return;
        autoStartedRef.current = true;
        play(stations[0]);
    }, [ stations, play ]);

    const toggle = useCallback((station: RadioStation) =>
    {
        if(currentId === station.id) stop();
        else play(station);
    }, [ currentId, play, stop ]);

    const setVolume = useCallback((value: number) =>
    {
        const v = Math.max(0, Math.min(1, value));
        setVolumeState(v);
        if(audioRef.current) audioRef.current.volume = v;
    }, []);

    return { stations, currentId, isPlaying, volume, loadError, play, stop, toggle, setVolume };
};

export const useRadio = () => useBetween(useRadioState);
