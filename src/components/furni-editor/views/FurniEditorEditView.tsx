import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Column, Flex, LayoutFurniIconImageView, Text } from '../../../common';
import { FurniDetail } from '../../../hooks/furni-editor';

interface FurniEditorEditViewProps {
    item: FurniDetail;
    furniDataEntry: Record<string, unknown> | null;
    furniDataDiagnostic: Record<string, unknown> | null;
    interactions: string[];
    loading: boolean;
    onUpdate: (id: number, fields: Record<string, unknown>) => void;
    onDelete: (id: number) => void;
    onBack: () => void;
    onUpdateFurnidata: (id: number, name: string, description: string) => void;
    onRevertFurnidata: (id: number) => void;
    onSyncPublicName: (id: number, name: string) => void;
    onImportText: (id: number) => void;
    importResult: { found: boolean; name: string; description: string; classname: string; nonce: number } | null;
}

const FIELD_TIPS: Record<string, string> = {
    stackHeight: 'Visual height when items are stacked on top of this furniture',
    interactionType: 'Defines behavior when user interacts (e.g. default, gate, teleport, vendingmachine)',
    customparams: 'Extra parameters for the interaction type (format depends on interaction)',
    interactionModesCount: 'Number of visual states/animations this furniture has'
};

const PERM_GROUPS = [
    { label: 'Gameplay', keys: ['allowStack', 'allowWalk', 'allowSit', 'allowLay', 'allowInventoryStack'] },
    { label: 'Trading', keys: ['allowGift', 'allowTrade', 'allowRecycle', 'allowMarketplaceSell'] }
];

interface SectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const Section: FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="bg-[#ffffff] rounded-xl border border-slate-200 shadow-sm">
            <button
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-xl ${open ? '' : 'rounded-b-xl'}`}
                onClick={() => setOpen((p) => !p)}
            >
                <Text className="text-[12px] font-semibold text-slate-700">{title}</Text>
                <span className="text-[11px] text-slate-400 transition-transform duration-200" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    ▾
                </span>
            </button>
            {open && <div className="px-3 pb-2.5 pt-0.5">{children}</div>}
        </div>
    );
};

const Tip: FC<{ field: string }> = ({ field }) => {
    const tip = FIELD_TIPS[field];
    const ref = useRef<HTMLSpanElement>(null);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    const show = useCallback(() => {
        const r = ref.current?.getBoundingClientRect();
        if (r) setPos({ left: r.left + r.width / 2, top: r.top - 6 });
    }, []);
    const hide = useCallback(() => setPos(null), []);

    if (!tip) return null;

    return (
        <span
            ref={ref}
            onMouseEnter={show}
            onMouseLeave={hide}
            className="ml-0.5 inline-flex w-3 h-3 rounded-full bg-[#1e7295] text-white text-[8px] items-center justify-center cursor-help font-bold align-middle"
        >
            ?
            {pos &&
                createPortal(
                    <span
                        style={{ position: 'fixed', left: pos.left, top: pos.top, transform: 'translate(-50%, -100%)', zIndex: 9999 }}
                        className="px-2 py-1 bg-[#333] text-white text-[10px] rounded w-44 whitespace-normal text-center leading-snug shadow-lg pointer-events-none"
                    >
                        {tip}
                    </span>,
                    document.body
                )}
        </span>
    );
};

const CopyValue: FC<{ value: string | number }> = ({ value }) => {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(() => {
        const text = String(value);
        if (navigator.clipboard?.writeText)
            navigator.clipboard
                .writeText(text)
                .then(() => setCopied(true))
                .catch(() => setCopied(true));
        else setCopied(true);
    }, [value]);

    // Reset the "copied!" flag after 1s, with cleanup so the timer never fires after unmount.
    useEffect(() => {
        if (!copied) return;

        const handle = window.setTimeout(() => setCopied(false), 1000);

        return () => window.clearTimeout(handle);
    }, [copied]);

    return (
        <div
            role="button"
            title="Click to copy"
            onClick={copy}
            className={`group relative cursor-pointer w-full px-3 py-1.5 text-sm font-mono rounded-lg border transition ${copied ? 'border-primary/50 bg-primary/5 text-primary' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'}`}
        >
            <span className="block truncate pr-12">{String(value)}</span>
            <span
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-wide pointer-events-none ${copied ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}
            >
                {copied ? 'copied!' : 'copy'}
            </span>
        </div>
    );
};

export const FurniEditorEditView: FC<FurniEditorEditViewProps> = (props) => {
    const {
        item,
        furniDataEntry,
        furniDataDiagnostic,
        interactions,
        loading,
        onUpdate,
        onDelete,
        onBack,
        onUpdateFurnidata,
        onRevertFurnidata,
        onSyncPublicName,
        onImportText,
        importResult
    } = props;
    const saveRef = useRef<() => void>(null);

    const [form, setForm] = useState({
        itemName: '',
        publicName: '',
        spriteId: 0,
        type: 's',
        width: 1,
        length: 1,
        stackHeight: 0,
        allowStack: true,
        allowWalk: false,
        allowSit: false,
        allowLay: false,
        allowGift: true,
        allowTrade: true,
        allowRecycle: true,
        allowMarketplaceSell: true,
        allowInventoryStack: true,
        interactionType: '',
        interactionModesCount: 0,
        customparams: ''
    });

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [furniName, setFurniName] = useState('');
    const [furniDescription, setFurniDescription] = useState('');
    const [confirmFurnidata, setConfirmFurnidata] = useState(false);
    const [importNote, setImportNote] = useState('');
    const appliedImportNonce = useRef(0);

    useEffect(() => {
        if (!item) return;

        setForm({
            itemName: item.itemName || '',
            publicName: item.publicName || '',
            spriteId: item.spriteId || 0,
            type: item.type || 's',
            width: item.width || 1,
            length: item.length || 1,
            stackHeight: item.stackHeight || 0,
            allowStack: !!item.allowStack,
            allowWalk: !!item.allowWalk,
            allowSit: !!item.allowSit,
            allowLay: !!item.allowLay,
            allowGift: !!item.allowGift,
            allowTrade: !!item.allowTrade,
            allowRecycle: !!item.allowRecycle,
            allowMarketplaceSell: !!item.allowMarketplaceSell,
            allowInventoryStack: !!item.allowInventoryStack,
            interactionType: item.interactionType || '',
            interactionModesCount: item.interactionModesCount || 0,
            customparams: item.customparams || ''
        });

        setShowDeleteDialog(false);
        setFurniName(String(furniDataEntry?.name ?? ''));
        setFurniDescription(String(furniDataEntry?.description ?? ''));
        setConfirmFurnidata(false);
        setImportNote('');
    }, [item, furniDataEntry]);

    const setField = useCallback((key: string, value: unknown) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const isDirty = useMemo(() => {
        if (!item) return false;

        return (
            form.itemName !== (item.itemName || '') ||
            form.publicName !== (item.publicName || '') ||
            form.spriteId !== (item.spriteId || 0) ||
            form.type !== (item.type || 's') ||
            form.width !== (item.width || 1) ||
            form.length !== (item.length || 1) ||
            form.stackHeight !== (item.stackHeight || 0) ||
            form.allowStack !== !!item.allowStack ||
            form.allowWalk !== !!item.allowWalk ||
            form.allowSit !== !!item.allowSit ||
            form.allowLay !== !!item.allowLay ||
            form.allowGift !== !!item.allowGift ||
            form.allowTrade !== !!item.allowTrade ||
            form.allowRecycle !== !!item.allowRecycle ||
            form.allowMarketplaceSell !== !!item.allowMarketplaceSell ||
            form.allowInventoryStack !== !!item.allowInventoryStack ||
            form.interactionType !== (item.interactionType || '') ||
            form.interactionModesCount !== (item.interactionModesCount || 0) ||
            form.customparams !== (item.customparams || '')
        );
    }, [form, item]);

    const validation = useMemo(() => {
        const errors: Record<string, string> = {};

        if (!form.itemName.trim()) errors.itemName = 'Required';
        if (!form.publicName.trim()) errors.publicName = 'Required';
        if (form.width < 1) errors.width = 'Min 1';
        if (form.length < 1) errors.length = 'Min 1';
        if (form.stackHeight < 0) errors.stackHeight = 'Min 0';

        return errors;
    }, [form]);

    const isValid = useMemo(() => Object.keys(validation).length === 0, [validation]);

    // Furnidata name editing only works when the furni has a matching furnidata
    // entry: the server writer is edit-only and refuses classnames absent from
    // furnidata (pets, custom items, …). furniDataEntry is the entry resolved by
    // the server (by id); guard on it + a classname match so we never trigger the
    // cryptic "Classname not found in furnidata" error on save.
    const furnidataEditable = useMemo(() => {
        if (!furniDataEntry) return false;
        const cn = String((furniDataEntry as { classname?: unknown }).classname ?? '')
            .trim()
            .toLowerCase();
        const itemCn = String(item?.itemName ?? '')
            .trim()
            .toLowerCase();
        return cn ? cn === itemCn : true;
    }, [furniDataEntry, item]);

    // No furnidata entry at all → the editor can CREATE one (the server upserts:
    // it builds a complete entry from items_base on save). Distinct from the
    // classname-mismatch case (an entry resolved by id but for a different
    // classname), which stays locked to avoid an id collision.
    const furnidataCreatable = useMemo(() => !furniDataEntry, [furniDataEntry]);

    // Show a one-click "sync" when the DB public_name is empty but the (matching)
    // furnidata entry already has a name — fills items_base.public_name from the
    // stored furnidata name so the DB fallback stops being blank.
    const canSyncPublicName = useMemo(
        () => furnidataEditable && !String(form.publicName ?? '').trim() && !!String(furniDataEntry?.name ?? '').trim(),
        [furnidataEditable, form.publicName, furniDataEntry]
    );

    // True only when the name/description actually differ from the stored furnidata
    // entry. Used to gate the Save button: saving an unchanged value makes the
    // server writer return false, which the handler misreports as "Classname not
    // found in furnidata" — so we never let an unchanged save fire.
    const furnidataDirty = useMemo(
        () => furniName !== String(furniDataEntry?.name ?? '') || furniDescription !== String(furniDataEntry?.description ?? ''),
        [furniName, furniDescription, furniDataEntry]
    );

    const furnidataMissReason = useMemo(() => {
        const reason = String(furniDataDiagnostic?.reason ?? '');
        return reason || 'not_found';
    }, [furniDataDiagnostic]);

    const furnidataSourcePath = String(furniDataDiagnostic?.sourcePath ?? '');

    // Apply an "Import from Habbo" result into the editable fields (review then Save).
    useEffect(() => {
        if (!importResult || importResult.nonce === appliedImportNonce.current) return;
        appliedImportNonce.current = importResult.nonce;

        // Ignore a result that belongs to a different furni (user navigated away).
        if (
            importResult.classname &&
            importResult.classname.trim().toLowerCase() !==
                String(item?.itemName ?? '')
                    .trim()
                    .toLowerCase()
        )
            return;

        if (importResult.found) {
            setFurniName(importResult.name);
            setFurniDescription(importResult.description);
            setImportNote('Imported from Habbo — review and Save');
        } else {
            setImportNote('Not found on Habbo for this classname');
        }
    }, [importResult, item]);

    const handleSave = useCallback(() => {
        if (!isValid) return;

        onUpdate(item.id, form);
    }, [item, form, isValid, onUpdate]);

    // Expose save for keyboard shortcut
    saveRef.current = handleSave;

    const handleBack = useCallback(() => {
        if (isDirty && !window.confirm('You have unsaved changes. Discard and go back?')) return;

        onBack();
    }, [isDirty, onBack]);

    const handleDeleteConfirm = useCallback(() => {
        onDelete(item.id);
        setShowDeleteDialog(false);
    }, [item, onDelete]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveRef.current?.();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    const inputClass = (field?: string) =>
        `w-full px-3 py-1.5 text-sm leading-normal rounded-lg border border-slate-300 bg-[#ffffff] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition${field && validation[field] ? ' border-red-400 bg-red-50' : ''}`;
    const labelClass = 'text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-0.5';

    return (
        <Column gap={1}>
            {/* Header */}
            <Flex alignItems="center" gap={2} className="px-1">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-[#ffffff] border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <LayoutFurniIconImageView productType={item.type} productClassId={item.spriteId} className="scale-[1.6]" />
                </div>
                <Flex column gap={0} className="min-w-0 flex-1">
                    <Text bold className="truncate text-slate-800 text-[15px] leading-tight">
                        {furniName || form.publicName || form.itemName}
                    </Text>
                    <Text className="truncate text-slate-400 text-[11px] font-mono">{form.itemName}</Text>
                    <Flex alignItems="center" gap={1} className="mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] rounded-md border border-slate-200 bg-slate-50 pl-1.5 pr-2 py-0.5">
                            <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">ID</span>
                            <span className="font-mono text-slate-600">{item.id}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] rounded-md border border-slate-200 bg-slate-50 pl-1.5 pr-2 py-0.5">
                            <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Sprite</span>
                            <span className="font-mono text-slate-600">{item.spriteId}</span>
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 text-[10px] rounded-md border px-2 py-0.5 ${item.usageCount > 0 ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.usageCount > 0 ? 'bg-[#10b981]' : 'bg-slate-300'}`} />
                            {item.usageCount} in use
                        </span>
                        {isDirty && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-md px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                                Unsaved
                            </span>
                        )}
                    </Flex>
                </Flex>
                <Button variant="secondary" onClick={handleBack} className="shrink-0">
                    Back
                </Button>
            </Flex>

            {/* Primary edit surface: furnidata display name + description (server-authoritative, live) */}
            <div className="bg-[#ffffff] rounded-xl border border-slate-200 shadow-sm p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                    <Text className="text-[12px] font-semibold text-slate-700">Display name &amp; description</Text>
                    {furnidataEditable ? (
                        <span className="text-[9px] font-semibold text-primary bg-primary/10 rounded-md px-1.5 py-0.5">LIVE</span>
                    ) : furnidataCreatable ? (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 rounded-md px-1.5 py-0.5">NEW</span>
                    ) : (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 rounded-md px-1.5 py-0.5">NO FURNIDATA</span>
                    )}
                    {furnidataEditable && furnidataDirty && <span className="ml-auto text-[10px] text-amber-600 font-medium">Unsaved</span>}
                </div>
                {furnidataEditable || furnidataCreatable ? (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>Display Name (furnidata)</label>
                                <input
                                    className={inputClass()}
                                    value={furniName}
                                    onChange={(e) => setFurniName(e.target.value)}
                                    maxLength={256}
                                    placeholder={furnidataCreatable ? form.publicName || form.itemName : undefined}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Description</label>
                                <input
                                    className={inputClass()}
                                    value={furniDescription}
                                    onChange={(e) => setFurniDescription(e.target.value)}
                                    maxLength={256}
                                />
                            </div>
                        </div>
                        <Flex gap={1} className="mt-1.5" alignItems="center">
                            <Button
                                variant="success"
                                disabled={furnidataEditable ? loading || !furnidataDirty : loading}
                                onClick={() => setConfirmFurnidata(true)}
                            >
                                {furnidataEditable ? 'Save name/desc' : 'Create entry'}
                            </Button>
                            {furnidataEditable && (
                                <>
                                    <Button variant="secondary" disabled={loading} onClick={() => onRevertFurnidata(item.id)}>
                                        Revert
                                    </Button>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => onImportText(item.id)}
                                        title="Fetch the official name &amp; description from Habbo"
                                        className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-[#ffffff] text-slate-600 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition"
                                    >
                                        <svg
                                            className="w-3.5 h-3.5"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M10 3v9" />
                                            <path d="m6.5 8.5 3.5 3.5 3.5-3.5" />
                                            <path d="M4 16h12" />
                                        </svg>
                                        Import from Habbo
                                    </button>
                                </>
                            )}
                        </Flex>
                        {furnidataCreatable && (
                            <Text className="mt-1 text-[10px] text-emerald-600">
                                No furnidata entry yet — saving creates a complete one from the item data.
                            </Text>
                        )}
                        {importNote && (
                            <Text className={`mt-1 text-[10px] ${importNote.startsWith('Not found') ? 'text-amber-600' : 'text-primary'}`}>{importNote}</Text>
                        )}
                    </>
                ) : (
                    <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 leading-snug">
                        <span className="text-[#f59e0b] text-sm leading-none mt-px">⚠</span>
                        <span>
                            A furnidata entry resolved by id but for a <b>different classname</b> ({furnidataMissReason.replace(/_/g, ' ')}) — name editing is
                            locked to avoid an id collision. Clients fall back to the DB <b>Public Name</b> below.
                        </span>
                    </div>
                )}
            </div>

            <Section title="Basic Info">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClass}>Classname</label>
                        <CopyValue value={form.itemName} />
                    </div>
                    <div>
                        <label className={labelClass}>Public Name (DB fallback)</label>
                        <CopyValue value={form.publicName} />
                        {canSyncPublicName && (
                            <Button
                                variant="secondary"
                                disabled={loading}
                                className="mt-1 w-full"
                                onClick={() => onSyncPublicName(item.id, String(furniDataEntry?.name ?? ''))}
                            >
                                Sync from furnidata
                            </Button>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Sprite ID</label>
                        <CopyValue value={form.spriteId} />
                    </div>
                    <div>
                        <label className={labelClass}>Type</label>
                        <CopyValue value={form.type === 's' ? 'Floor (s)' : 'Wall (i)'} />
                    </div>
                </div>
            </Section>

            {furniDataEntry && (
                <Section title="FurniData.json" defaultOpen={false}>
                    <Text className="text-[10px] text-slate-400 mb-1 block">
                        Read-only — how this furni resolves from the furnidata JSON (source of truth for the display name).
                    </Text>
                    <pre className="text-[10px] leading-snug text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-auto max-h-52 whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(furniDataEntry, null, 2)}
                    </pre>
                </Section>
            )}

            <Section title="Furnidata Debug" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className={labelClass}>Resolution</label>
                        <CopyValue value={furnidataMissReason} />
                    </div>
                    <div>
                        <label className={labelClass}>Source</label>
                        <CopyValue value={furnidataSourcePath || 'unresolved'} />
                    </div>
                </div>
                <pre className="text-[10px] leading-snug text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(furniDataDiagnostic ?? {}, null, 2)}
                </pre>
            </Section>

            <Section title="Dimensions">
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className={labelClass}>Width</label>
                        <input type="number" className={inputClass('width')} value={form.width} onChange={(e) => setField('width', Number(e.target.value))} />
                        {validation.width && <span className="text-[9px] text-red-500">{validation.width}</span>}
                    </div>
                    <div>
                        <label className={labelClass}>Length</label>
                        <input
                            type="number"
                            className={inputClass('length')}
                            value={form.length}
                            onChange={(e) => setField('length', Number(e.target.value))}
                        />
                        {validation.length && <span className="text-[9px] text-red-500">{validation.length}</span>}
                    </div>
                    <div>
                        <label className={labelClass}>
                            Stack Height
                            <Tip field="stackHeight" />
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className={inputClass('stackHeight')}
                            value={form.stackHeight}
                            onChange={(e) => setField('stackHeight', Number(e.target.value))}
                        />
                        {validation.stackHeight && <span className="text-[9px] text-red-500">{validation.stackHeight}</span>}
                    </div>
                </div>
            </Section>

            <Section title="Permissions">
                <div className="flex flex-col gap-2">
                    {PERM_GROUPS.map((group) => (
                        <div key={group.label}>
                            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">{group.label}</Text>
                            <div className="flex flex-wrap gap-1.5">
                                {group.keys.map((key) => {
                                    const on = (form as any)[key];
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setField(key, !on)}
                                            aria-pressed={on}
                                            title={on ? 'Enabled — click to disable' : 'Disabled — click to enable'}
                                            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${on ? 'bg-[#1E7295] border-[#1E7295] text-[#ffffff] shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                        >
                                            <span
                                                className={`inline-block w-2 h-2 rounded-full ring-1 ${on ? 'bg-[#22c55e] ring-[#ffffff]/70' : 'bg-[#ef4444] ring-[#00000014]'}`}
                                            />
                                            {key.replace('allow', '')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Interaction">
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <label className={labelClass}>
                            Type
                            <Tip field="interactionType" />
                        </label>
                        <select
                            className="w-full px-2 py-1 text-sm leading-normal rounded-sm border border-[#bbb] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 pr-8"
                            value={form.interactionType}
                            onChange={(e) => setField('interactionType', e.target.value)}
                        >
                            <option value="">none</option>
                            {interactions.map((i) => (
                                <option key={i} value={i}>
                                    {i}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>
                            Modes
                            <Tip field="interactionModesCount" />
                        </label>
                        <input
                            type="number"
                            className={inputClass()}
                            value={form.interactionModesCount}
                            onChange={(e) => setField('interactionModesCount', Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="mt-1">
                    <label className={labelClass}>
                        Custom Params
                        <Tip field="customparams" />
                    </label>
                    <input className={inputClass()} value={form.customparams} onChange={(e) => setField('customparams', e.target.value)} />
                </div>
            </Section>

            {/* Actions */}
            <Flex gap={1} justifyContent="between" alignItems="center" className="mt-1">
                <Flex gap={1} alignItems="center">
                    <Button variant="success" disabled={loading || !isValid || !isDirty} onClick={handleSave}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <span className="text-[9px] text-[#999]">Ctrl+S</span>
                </Flex>
                <Button variant="danger" disabled={loading || item.usageCount > 0} onClick={() => setShowDeleteDialog(true)}>
                    Delete
                </Button>
            </Flex>

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-[60]" onClick={() => setShowDeleteDialog(false)}>
                    <div className="bg-[#ffffff] rounded-lg shadow-xl p-4 w-[320px]" onClick={(e) => e.stopPropagation()}>
                        <Text bold className="text-[14px] mb-2 block">
                            Delete Item?
                        </Text>
                        <Text small className="mb-3 block text-[#666]">
                            Are you sure you want to delete <strong>{item.publicName || item.itemName}</strong> (ID: {item.id})? This action cannot be undone.
                        </Text>
                        <Flex gap={1} justifyContent="end">
                            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDeleteConfirm}>
                                Delete
                            </Button>
                        </Flex>
                    </div>
                </div>
            )}

            {/* Furnidata Confirmation Dialog */}
            {confirmFurnidata && (
                <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-[60]" onClick={() => setConfirmFurnidata(false)}>
                    <div className="bg-[#ffffff] rounded-lg shadow-xl p-4 w-[320px]" onClick={(e) => e.stopPropagation()}>
                        <Text bold className="text-[14px] mb-2 block">
                            Apply furnidata change to ALL clients?
                        </Text>
                        <div className="text-xs mb-1">
                            <b>Name:</b> {String(furniDataEntry?.name ?? '')} → {furniName}
                        </div>
                        <div className="text-xs mb-3">
                            <b>Desc:</b> {String(furniDataEntry?.description ?? '')} → {furniDescription}
                        </div>
                        <Flex gap={1} justifyContent="end">
                            <Button variant="secondary" onClick={() => setConfirmFurnidata(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={() => {
                                    onUpdateFurnidata(item.id, furniName, furniDescription);
                                    setConfirmFurnidata(false);
                                }}
                            >
                                Confirm
                            </Button>
                        </Flex>
                    </div>
                </div>
            )}
        </Column>
    );
};
