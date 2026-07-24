import * as Popover from '@radix-ui/react-popover';
import { HabbiconAssetManager, UseHabbiconComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { GetConfigurationValue, LocalizeText, SendMessageComposer } from '../../../../api';
import { HabbiconsLogo, UseHabbiconIcon } from '../../../../assets/images/habbicons';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common';

type HabbiconEntry = {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    category: string;
};

type HabbiconSection = {
    id: string;
    title: string;
    entries: HabbiconEntry[];
};

const RECENT_HABBICONS_STORAGE_KEY = 'nitro.habbicons.recent';
const RECENT_HABBICONS_LIMIT = 10;
const HABBICON_CELL_SIZE = 42;

const getRecentHabbicons = (): number[] => {
    if(typeof window === 'undefined') return [];

    try {
        const parsed = JSON.parse(window.localStorage.getItem(RECENT_HABBICONS_STORAGE_KEY) || '[]');

        return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean).slice(0, RECENT_HABBICONS_LIMIT) : [];
    } catch {
        return [];
    }
};

const getHabbiconsBaseUrl = () => {
    const root = GetConfigurationValue<string>('habbicons.asset.root', '');
    const hash = GetConfigurationValue<string>('habbicons.asset.hash', '');

    if(!root) return '';

    const cleanRoot = root.endsWith('/') ? root : `${ root }/`;

    if(hash && hash.length) return `${ cleanRoot }${ hash }/`;

    return cleanRoot;
};

const formatHabbiconTitle = (name: string, id: number) => {
    if(!name) return `Habbicon ${ id }`;

    return name
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const getCategory = (name: string) => {
    const prefix = (name || '').split('_')[0];

    if(!prefix) return 'habbicons';

    return prefix;
};

const getCategoryTitle = (category: string) => {
    const key = `habbicon_book.category.${ category }`;
    const localized = LocalizeText(key);

    if(localized && localized !== key) return localized;

    return category.charAt(0).toUpperCase() + category.slice(1);
};

const createSections = (entries: HabbiconEntry[], search: string): HabbiconSection[] => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
        ? entries.filter(entry => entry.name.toLowerCase().includes(normalizedSearch) || entry.id.toString().includes(normalizedSearch))
        : entries;
    const sections = new Map<string, HabbiconEntry[]>();

    for(const entry of filtered)
    {
        const list = sections.get(entry.category) || [];

        list.push(entry);
        sections.set(entry.category, list);
    }

    return Array.from(sections.entries()).map(([id, sectionEntries]) => ({
        id,
        title: getCategoryTitle(id),
        entries: sectionEntries
    }));
};

export const ChatInputHabbiconSelectorView: FC = () => {
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [bookVisible, setBookVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [habbicons, setHabbicons] = useState<HabbiconEntry[]>([]);
    const [recentHabbiconIds, setRecentHabbiconIds] = useState<number[]>(() => getRecentHabbicons());
    const enabled = GetConfigurationValue<boolean>('habbicons.enabled', false);
    const baseUrl = useMemo(() => getHabbiconsBaseUrl(), []);
    const sections = useMemo(() => createSections(habbicons, search), [habbicons, search]);
    const displaySections = useMemo(() => {
        if(search.trim().length) return sections;

        const recentEntries = recentHabbiconIds
            .map(id => habbicons.find(entry => entry.id === id))
            .filter(Boolean) as HabbiconEntry[];

        if(!recentEntries.length) return sections;

        return [
            {
                id: 'recent',
                title: 'Usato di recente',
                entries: recentEntries
            },
            ...sections
        ];
    }, [habbicons, recentHabbiconIds, search, sections]);

    useEffect(() => {
        if(!enabled || !baseUrl) return;

        void HabbiconAssetManager.getInstance().preload();

        let disposed = false;

        void (async () => {
            try {
                const response = await fetch(`${ baseUrl }habbicons.json`);

                if(!response.ok) return;

                const data = await response.json();
                const entries = (Array.isArray(data?.habbicons) ? data.habbicons : [])
                    .map((entry: any) => {
                        const id = Number(entry?.id);
                        const name = String(entry?.name || '');
                        const x = Number(entry?.x) || 0;
                        const y = Number(entry?.y) || 0;
                        const width = Number(entry?.width) || HABBICON_CELL_SIZE;
                        const height = Number(entry?.height) || HABBICON_CELL_SIZE;

                        return {
                            id,
                            x,
                            y,
                            width,
                            height,
                            name,
                            category: getCategory(name)
                        };
                    })
                    .filter((entry: HabbiconEntry) => entry.id > 0);

                if(!disposed) {
                    setHabbicons(entries);
                }
            } catch {
                if(!disposed) setHabbicons([]);
            }
        })();

        return () => {
            disposed = true;
        };
    }, [enabled, baseUrl]);

    if(!enabled || !baseUrl) return null;

    const applyHabbicon = async (habbiconId: number) => {
        await HabbiconAssetManager.getInstance().preload();
        SendMessageComposer(new UseHabbiconComposer(habbiconId));
        const nextRecent = [habbiconId, ...recentHabbiconIds.filter(id => id !== habbiconId)].slice(0, RECENT_HABBICONS_LIMIT);

        setRecentHabbiconIds(nextRecent);
        window.localStorage.setItem(RECENT_HABBICONS_STORAGE_KEY, JSON.stringify(nextRecent));
        setSelectorVisible(false);
    };

    return (
        <Popover.Root open={selectorVisible} onOpenChange={setSelectorVisible}>
            <Popover.Trigger asChild>
                <button className="habbicon-chat-trigger" title={LocalizeText('habbicons.hud.title')} type="button">
                    <img alt="" src={UseHabbiconIcon} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className="habbicon-selector-popover" side="top" sideOffset={8}>
                    <div className="habbicon-selector-window">
                        <div className="habbicon-selector-controls">
                            <div className="habbicon-selector-search">
                                <input
                                    maxLength={24}
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                />
                                {!search && <span>Cerca</span>}
                                {search && (
                                    <button type="button" onClick={() => setSearch('')}>
                                        ×
                                    </button>
                                )}
                            </div>
                            <button className="habbicon-selector-book-button" type="button" onClick={() => setBookVisible(true)}>
                                <span>Apri menu</span>
                            </button>
                        </div>
                        {displaySections.length > 0 ? (
                            <div className="habbicon-selector-sections has-classic-scrollbar">
                                {displaySections.map(section => (
                                    <section key={section.id} className="habbicon-selector-section">
                                        <div className="habbicon-selector-section-title">{section.title}</div>
                                        <div className="habbicon-selector-grid">
                                            {section.entries.map(entry => (
                                                <button
                                                    key={entry.id}
                                                    className="habbicon-selector-item"
                                                    title={formatHabbiconTitle(entry.name, entry.id)}
                                                    type="button"
                                                    onClick={() => void applyHabbicon(entry.id)}
                                                >
                                                    <span
                                                        style={{
                                                            width: entry.width,
                                                            height: entry.height,
                                                            backgroundImage: `url(${ baseUrl }habbicons_spritesheet.png)`,
                                                            backgroundPosition: `-${ entry.x }px -${ entry.y }px`
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="habbicon-selector-empty">{LocalizeText('habbicons.no_habbicons')}</div>
                        )}
                    </div>
                </Popover.Content>
            </Popover.Portal>
            {bookVisible && (
                <DraggableWindow uniqueKey="habbicon-book" windowPosition={DraggableWindowPosition.CENTER}>
                <div className="habbicon-book-window">
                    <div className="habbicon-book-header drag-handler">
                        <img alt="" src={HabbiconsLogo} />
                        <div>
                            <strong>{LocalizeText('habbicon_book.title')}</strong>
                            <span>{LocalizeText('habbicon_book.subtitle')}</span>
                        </div>
                        <button type="button" onClick={() => setBookVisible(false)}>×</button>
                    </div>
                    <div className="habbicon-book-tabs">
                        <button type="button">{LocalizeText('habbicon_book.tab.all_sets')}</button>
                        <button type="button">{LocalizeText('habbicon_book.tab.owned')}</button>
                        <button type="button">{LocalizeText('habbicon_book.tab.favourited')}</button>
                    </div>
                    <div className="habbicon-book-body">
                        <div className="habbicon-book-rail has-classic-scrollbar">
                            {sections.map(section => (
                                <button key={section.id} type="button">
                                    <span>{section.title}</span>
                                    <small>{section.entries.length}/{section.entries.length}</small>
                                </button>
                            ))}
                        </div>
                        <div className="habbicon-book-page has-classic-scrollbar">
                            {sections.map(section => (
                                <section key={section.id}>
                                    <h3>{section.title}</h3>
                                    <div className="habbicon-book-grid">
                                        {section.entries.map(entry => (
                                            <button key={entry.id} type="button" onClick={() => void applyHabbicon(entry.id)}>
                                                <span
                                                    style={{
                                                        width: entry.width,
                                                        height: entry.height,
                                                        backgroundImage: `url(${ baseUrl }habbicons_spritesheet.png)`,
                                                        backgroundPosition: `-${ entry.x }px -${ entry.y }px`
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
                </DraggableWindow>
            )}
        </Popover.Root>
    );
};
