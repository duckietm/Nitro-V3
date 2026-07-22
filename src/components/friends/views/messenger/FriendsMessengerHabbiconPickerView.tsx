import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfigurationValue, LocalizeText } from '../../../../api';

type HabbiconEntry = { id: number; x: number; y: number; width: number; height: number; name: string; };

const RECENT_STORAGE_KEY = 'nitro.messenger.habbicons.recent';
const MAX_RECENT = 10;

const getAssetRoot = () => {
    const root = GetConfigurationValue<string>('habbicons.asset.root', '');
    const hash = GetConfigurationValue<string>('habbicons.asset.hash', '');

    if (!root) return '';

    const normalizedRoot = root.endsWith('/') ? root : `${root}/`;

    return hash ? `${normalizedRoot}${hash}/` : normalizedRoot;
};

const getRecent = () => {
    try {
        const values = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) || '[]');

        return Array.isArray(values) ? values.map(Number).filter(Boolean).slice(0, MAX_RECENT) : [];
    } catch {
        return [] as number[];
    }
};

export const FriendsMessengerHabbiconPickerView: FC<{ onClose: () => void; onSelect: (id: number) => void }> = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState<HabbiconEntry[]>([]);
    const [recentIds, setRecentIds] = useState<number[]>(getRecent);
    const assetRoot = useMemo(getAssetRoot, []);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) onClose();
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose]);

    useEffect(() => {
        if (!assetRoot) return;

        let disposed = false;

        void fetch(`${assetRoot}habbicons.json`)
            .then((response) => response.ok ? response.json() : null)
            .then((data) => {
                if (disposed || !Array.isArray(data?.habbicons)) return;

                setEntries(data.habbicons.map((entry: any) => ({
                    id: Number(entry?.id),
                    x: Number(entry?.x) || 0,
                    y: Number(entry?.y) || 0,
                    width: Number(entry?.width) || 42,
                    height: Number(entry?.height) || 42,
                    name: String(entry?.name || '')
                })).filter((entry: HabbiconEntry) => entry.id > 0));
            })
            .catch(() => !disposed && setEntries([]));

        return () => { disposed = true; };
    }, [assetRoot]);

    const visibleEntries = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const filtered = normalizedSearch
            ? entries.filter((entry) => entry.name.toLowerCase().includes(normalizedSearch) || entry.id.toString() === normalizedSearch)
            : entries;
        const recent = recentIds.map((id) => entries.find((entry) => entry.id === id)).filter(Boolean) as HabbiconEntry[];

        return { filtered, recent };
    }, [entries, recentIds, search]);

    const choose = (id: number) => {
        const nextRecent = [id, ...recentIds.filter((recentId) => recentId !== id)].slice(0, MAX_RECENT);

        setRecentIds(nextRecent);
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(nextRecent));
        onSelect(id);
    };

    const grid = (items: HabbiconEntry[]) => <div className="swf-messenger-habbicon-grid">
        {items.map((entry) => <button key={entry.id} type="button" title={entry.name || `Habbicon ${entry.id}`} onClick={() => choose(entry.id)}>
            <span style={{ width: entry.width, height: entry.height, backgroundImage: `url(${assetRoot}habbicons_spritesheet.png)`, backgroundPosition: `-${entry.x}px -${entry.y}px` }} />
        </button>)}
    </div>;

    return <div ref={pickerRef} className="swf-messenger-habbicon-picker" role="dialog" aria-label="Habbicons">
        <div className="swf-messenger-habbicon-controls">
            <input autoFocus maxLength={24} placeholder={LocalizeText('generic.search') || 'Cerca'} value={search} onChange={(event) => setSearch(event.target.value)} />
            <button type="button" onClick={onClose}>Apri menu</button>
        </div>
        <div className="swf-messenger-habbicon-scroll has-classic-scrollbar">
            {!search && visibleEntries.recent.length > 0 && <section><strong>Usato di recente</strong>{grid(visibleEntries.recent)}</section>}
            <section><strong>{search ? LocalizeText('habbicon.search.results') : 'Habbicons'}</strong>{grid(visibleEntries.filtered)}</section>
        </div>
    </div>;
};
