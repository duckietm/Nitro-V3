import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Column, Flex, LayoutFurniIconImageView, Text } from '../../../common';
import { FurniDetail } from '../../../hooks/furni-editor';

interface FurniEditorEditViewProps
{
    item: FurniDetail;
    furniDataEntry: Record<string, unknown> | null;
    interactions: string[];
    loading: boolean;
    onUpdate: (id: number, fields: Record<string, unknown>) => void;
    onDelete: (id: number) => void;
    onBack: () => void;
}

const FIELD_TIPS: Record<string, string> = {
    stackHeight: 'Visual height when items are stacked on top of this furniture',
    interactionType: 'Defines behavior when user interacts (e.g. default, gate, teleport, vendingmachine)',
    customparams: 'Extra parameters for the interaction type (format depends on interaction)',
    interactionModesCount: 'Number of visual states/animations this furniture has',
};

const PERM_GROUPS = [
    { label: 'Gameplay', keys: [ 'allowStack', 'allowWalk', 'allowSit', 'allowLay' ] },
    { label: 'Trading', keys: [ 'allowGift', 'allowTrade', 'allowRecycle', 'allowMarketplaceSell' ] },
    { label: 'Inventory', keys: [ 'allowInventoryStack' ] },
];

interface SectionProps { title: string; children: React.ReactNode; defaultOpen?: boolean }

const Section: FC<SectionProps> = ({ title, children, defaultOpen = true }) =>
{
    const [ open, setOpen ] = useState(defaultOpen);

    return (
        <div className="bg-white rounded border border-[#ccc]">
            <button
                type="button"
                className="w-full flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                onClick={ () => setOpen(p => !p) }
            >
                <Text small bold variant="primary">{ title }</Text>
                <span className="text-[10px] text-[#999]">{ open ? '▼' : '▶' }</span>
            </button>
            { open && <div className="px-2 pb-2">{ children }</div> }
        </div>
    );
};

const Tip: FC<{ field: string }> = ({ field }) =>
{
    const tip = FIELD_TIPS[field];

    if(!tip) return null;

    return (
        <span className="relative group ml-0.5 inline-flex">
            <span className="w-3 h-3 rounded-full bg-[#1e7295] text-white text-[8px] flex items-center justify-center cursor-help font-bold">?</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#333] text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                { tip }
            </span>
        </span>
    );
};

export const FurniEditorEditView: FC<FurniEditorEditViewProps> = props =>
{
    const { item, furniDataEntry, interactions, loading, onUpdate, onDelete, onBack } = props;
    const saveRef = useRef<() => void>(null);

    const [ form, setForm ] = useState({
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
        customparams: '',
    });

    const [ showDeleteDialog, setShowDeleteDialog ] = useState(false);

    useEffect(() =>
    {
        if(!item) return;

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
            customparams: item.customparams || '',
        });

        setShowDeleteDialog(false);
    }, [ item ]);

    const setField = useCallback((key: string, value: unknown) =>
    {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const isDirty = useMemo(() =>
    {
        if(!item) return false;

        return form.itemName !== (item.itemName || '') ||
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
            form.customparams !== (item.customparams || '');
    }, [ form, item ]);

    const validation = useMemo(() =>
    {
        const errors: Record<string, string> = {};

        if(!form.itemName.trim()) errors.itemName = 'Required';
        if(!form.publicName.trim()) errors.publicName = 'Required';
        if(form.width < 1) errors.width = 'Min 1';
        if(form.length < 1) errors.length = 'Min 1';
        if(form.stackHeight < 0) errors.stackHeight = 'Min 0';

        return errors;
    }, [ form ]);

    const isValid = useMemo(() => Object.keys(validation).length === 0, [ validation ]);

    const handleSave = useCallback(() =>
    {
        if(!isValid) return;

        onUpdate(item.id, form);
    }, [ item, form, isValid, onUpdate ]);

    // Expose save for keyboard shortcut
    saveRef.current = handleSave;

    const handleBack = useCallback(() =>
    {
        if(isDirty && !window.confirm('You have unsaved changes. Discard and go back?')) return;

        onBack();
    }, [ isDirty, onBack ]);

    const handleDeleteConfirm = useCallback(() =>
    {
        onDelete(item.id);
        setShowDeleteDialog(false);
    }, [ item, onDelete ]);

    // Keyboard shortcuts
    useEffect(() =>
    {
        const handler = (e: KeyboardEvent) =>
        {
            if(e.ctrlKey && e.key === 's')
            {
                e.preventDefault();
                saveRef.current?.();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    const inputClass = (field?: string) =>
        `w-full px-2 py-1 text-xs leading-normal rounded-sm border border-[#ccc] min-h-[calc(1.5em+0.5rem+2px)] ${ field && validation[field] ? 'border-red-500 bg-red-50' : '' }`;
    const labelClass = 'text-[11px] font-bold text-[#333] mb-0 flex items-center gap-0.5';

    return (
        <Column gap={ 1 } className="h-full overflow-auto">
            { /* Header */ }
            <Flex gap={ 2 } alignItems="center" className="mb-1">
                <Button variant="secondary" onClick={ handleBack }>Back</Button>
                <div className="bg-[#e9ecef] rounded border border-[#ccc] flex items-center justify-center w-[48px] h-[48px]">
                    <LayoutFurniIconImageView productType={ item.type } productClassId={ item.spriteId } className="scale-150" />
                </div>
                <Flex column gap={ 0 }>
                    <Flex alignItems="center" gap={ 1 }>
                        <Text bold className="text-[12px]">ID: { item.id }</Text>
                        <span className="text-[#999]">|</span>
                        <Text bold className="text-[12px]">Sprite: { item.spriteId }</Text>
                    </Flex>
                    <Text small variant="gray">({ item.usageCount } in use)</Text>
                </Flex>
                { isDirty && <span className="text-[10px] text-orange-500 font-bold ml-auto">Unsaved changes</span> }
            </Flex>

            <Section title="Basic Info">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={ labelClass }>Item Name</label>
                        <input className={ inputClass('itemName') } value={ form.itemName } onChange={ e => setField('itemName', e.target.value) } />
                        { validation.itemName && <span className="text-[9px] text-red-500">{ validation.itemName }</span> }
                    </div>
                    <div>
                        <label className={ labelClass }>Public Name</label>
                        <input className={ inputClass('publicName') } value={ form.publicName } onChange={ e => setField('publicName', e.target.value) } />
                        { validation.publicName && <span className="text-[9px] text-red-500">{ validation.publicName }</span> }
                    </div>
                    <div>
                        <label className={ labelClass }>Sprite ID</label>
                        <input type="number" className={ inputClass() } value={ form.spriteId } onChange={ e => setField('spriteId', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Type</label>
                        <select className="w-full px-2 py-1 text-xs leading-normal rounded-sm border border-[#ccc] pr-8" value={ form.type } onChange={ e => setField('type', e.target.value) }>
                            <option value="s">Floor (s)</option>
                            <option value="i">Wall (i)</option>
                        </select>
                    </div>
                </div>
            </Section>

            <Section title="Dimensions">
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className={ labelClass }>Width</label>
                        <input type="number" className={ inputClass('width') } value={ form.width } onChange={ e => setField('width', Number(e.target.value)) } />
                        { validation.width && <span className="text-[9px] text-red-500">{ validation.width }</span> }
                    </div>
                    <div>
                        <label className={ labelClass }>Length</label>
                        <input type="number" className={ inputClass('length') } value={ form.length } onChange={ e => setField('length', Number(e.target.value)) } />
                        { validation.length && <span className="text-[9px] text-red-500">{ validation.length }</span> }
                    </div>
                    <div>
                        <label className={ labelClass }>Stack Height<Tip field="stackHeight" /></label>
                        <input type="number" step="0.01" className={ inputClass('stackHeight') } value={ form.stackHeight } onChange={ e => setField('stackHeight', Number(e.target.value)) } />
                        { validation.stackHeight && <span className="text-[9px] text-red-500">{ validation.stackHeight }</span> }
                    </div>
                </div>
            </Section>

            <Section title="Permissions">
                <div className="flex flex-col gap-2">
                    { PERM_GROUPS.map(group => (
                        <div key={ group.label }>
                            <Text className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-0.5 block">{ group.label }</Text>
                            <div className="grid grid-cols-4 gap-x-3 gap-y-1">
                                { group.keys.map(key => (
                                    <label key={ key } className="flex items-center gap-1 text-[11px] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-1"
                                            checked={ (form as any)[key] }
                                            onChange={ e => setField(key, e.target.checked) }
                                        />
                                        { key.replace('allow', '') }
                                    </label>
                                )) }
                            </div>
                        </div>
                    )) }
                </div>
            </Section>

            <Section title="Interaction">
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <label className={ labelClass }>Type<Tip field="interactionType" /></label>
                        <select className="w-full px-2 py-1 text-xs leading-normal rounded-sm border border-[#ccc] pr-8" value={ form.interactionType } onChange={ e => setField('interactionType', e.target.value) }>
                            <option value="">none</option>
                            { interactions.map(i => (
                                <option key={ i } value={ i }>{ i }</option>
                            )) }
                        </select>
                    </div>
                    <div>
                        <label className={ labelClass }>Modes<Tip field="interactionModesCount" /></label>
                        <input type="number" className={ inputClass() } value={ form.interactionModesCount } onChange={ e => setField('interactionModesCount', Number(e.target.value)) } />
                    </div>
                </div>
                <div className="mt-1">
                    <label className={ labelClass }>Custom Params<Tip field="customparams" /></label>
                    <input className={ inputClass() } value={ form.customparams } onChange={ e => setField('customparams', e.target.value) } />
                </div>
            </Section>

            { furniDataEntry &&
                <Section title="FurniData.json" defaultOpen={ false }>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                        { Object.entries(furniDataEntry).map(([ key, value ]) => (
                            <div key={ key } className="flex justify-between bg-[#f5f5f5] px-2 py-0.5 rounded">
                                <span className="font-bold text-[#555]">{ key }</span>
                                <span className="text-[#333] truncate ml-1 max-w-[120px] text-right">{ String(value ?? '') }</span>
                            </div>
                        )) }
                    </div>
                </Section>
            }

            { /* Actions */ }
            <Flex gap={ 1 } justifyContent="between" alignItems="center" className="mt-1">
                <Flex gap={ 1 } alignItems="center">
                    <Button variant="success" disabled={ loading || !isValid || !isDirty } onClick={ handleSave }>
                        { loading ? 'Saving...' : 'Save' }
                    </Button>
                    <span className="text-[9px] text-[#999]">Ctrl+S</span>
                </Flex>
                <Button
                    variant="danger"
                    disabled={ loading || item.usageCount > 0 }
                    onClick={ () => setShowDeleteDialog(true) }
                >
                    Delete
                </Button>
            </Flex>

            { /* Delete Confirmation Dialog */ }
            { showDeleteDialog &&
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={ () => setShowDeleteDialog(false) }>
                    <div className="bg-white rounded-lg shadow-xl p-4 w-[320px]" onClick={ e => e.stopPropagation() }>
                        <Text bold className="text-[14px] mb-2 block">Delete Item?</Text>
                        <Text small className="mb-3 block text-[#666]">
                            Are you sure you want to delete <strong>{ item.publicName || item.itemName }</strong> (ID: { item.id })?
                            This action cannot be undone.
                        </Text>
                        <Flex gap={ 1 } justifyContent="end">
                            <Button variant="secondary" onClick={ () => setShowDeleteDialog(false) }>Cancel</Button>
                            <Button variant="danger" onClick={ handleDeleteConfirm }>Delete</Button>
                        </Flex>
                    </div>
                </div>
            }
        </Column>
    );
};
