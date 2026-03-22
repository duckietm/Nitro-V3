import { FC, useCallback, useEffect, useState } from 'react';
import { Button, Column, Flex, Text } from '../../../common';
import { CatalogRef, FurniDetail } from '../../../hooks/furni-editor';

interface FurniEditorEditViewProps
{
    item: FurniDetail;
    catalogItems: CatalogRef[];
    furniDataEntry: Record<string, unknown> | null;
    interactions: string[];
    loading: boolean;
    onUpdate: (id: number, fields: Record<string, unknown>) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
    onBack: () => void;
    onRefresh: (id: number) => void;
}

export const FurniEditorEditView: FC<FurniEditorEditViewProps> = props =>
{
    const { item, catalogItems, furniDataEntry, interactions, loading, onUpdate, onDelete, onBack, onRefresh } = props;

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

    const [ confirmDelete, setConfirmDelete ] = useState(false);

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

        setConfirmDelete(false);
    }, [ item ]);

    const setField = useCallback((key: string, value: unknown) =>
    {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = useCallback(async () =>
    {
        const ok = await onUpdate(item.id, form);

        if(ok) onRefresh(item.id);
    }, [ item, form, onUpdate, onRefresh ]);

    const handleDelete = useCallback(async () =>
    {
        if(!confirmDelete) return setConfirmDelete(true);

        const ok = await onDelete(item.id);

        if(ok) onBack();
    }, [ confirmDelete, item, onDelete, onBack ]);

    const inputClass = 'form-control form-control-sm';
    const labelClass = 'text-[11px] font-bold text-[#333] mb-0';

    return (
        <Column gap={ 1 } className="h-full overflow-auto">
            <Flex gap={ 1 } alignItems="center" className="mb-1">
                <Button variant="secondary" onClick={ onBack }>Back</Button>
                <Flex alignItems="center" gap={ 1 } className="bg-[#e9ecef] px-2 py-0.5 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-[#1e7295]">
                        <path fillRule="evenodd" d="M4.93 1.31a41.401 41.401 0 0 1 10.14 0C16.194 1.45 17 2.414 17 3.517V18.25a.75.75 0 0 1-1.075.676l-2.8-1.344-2.8 1.344a.75.75 0 0 1-.65 0l-2.8-1.344-2.8 1.344A.75.75 0 0 1 3 18.25V3.517c0-1.103.806-2.068 1.93-2.207Z" clipRule="evenodd" />
                    </svg>
                    <Text bold className="text-[12px]">{ item.id }</Text>
                    <span className="text-[#999] mx-0.5">|</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-[#1e7295]">
                        <path d="M12.586 2.586a2 2 0 1 1 2.828 2.828l-3 3a2 2 0 0 1-2.828 0 1 1 0 0 0-1.414 1.414 4 4 0 0 0 5.656 0l3-3a4 4 0 0 0-5.656-5.656l-1.5 1.5a1 1 0 1 0 1.414 1.414l1.5-1.5ZM7.414 17.414a2 2 0 1 1-2.828-2.828l3-3a2 2 0 0 1 2.828 0 1 1 0 0 0 1.414-1.414 4 4 0 0 0-5.656 0l-3 3a4 4 0 0 0 5.656 5.656l1.5-1.5a1 1 0 1 0-1.414-1.414l-1.5 1.5Z" />
                    </svg>
                    <Text bold className="text-[12px]">{ item.spriteId }</Text>
                </Flex>
                <Text small variant="gray">({ item.usageCount } in use)</Text>
            </Flex>

            { /* Basic Info */ }
            <div className="bg-white rounded border border-[#ccc] p-2">
                <Text small bold variant="primary" className="mb-1 block">Basic Info</Text>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={ labelClass }>Item Name</label>
                        <input className={ inputClass } value={ form.itemName } onChange={ e => setField('itemName', e.target.value) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Public Name</label>
                        <input className={ inputClass } value={ form.publicName } onChange={ e => setField('publicName', e.target.value) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Sprite ID</label>
                        <input type="number" className={ inputClass } value={ form.spriteId } onChange={ e => setField('spriteId', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Type</label>
                        <select className="form-select form-select-sm" value={ form.type } onChange={ e => setField('type', e.target.value) }>
                            <option value="s">Floor (s)</option>
                            <option value="i">Wall (i)</option>
                        </select>
                    </div>
                </div>
            </div>

            { /* Dimensions */ }
            <div className="bg-white rounded border border-[#ccc] p-2">
                <Text small bold variant="primary" className="mb-1 block">Dimensions</Text>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className={ labelClass }>Width</label>
                        <input type="number" className={ inputClass } value={ form.width } onChange={ e => setField('width', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Length</label>
                        <input type="number" className={ inputClass } value={ form.length } onChange={ e => setField('length', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Stack Height</label>
                        <input type="number" step="0.01" className={ inputClass } value={ form.stackHeight } onChange={ e => setField('stackHeight', Number(e.target.value)) } />
                    </div>
                </div>
            </div>

            { /* Permissions */ }
            <div className="bg-white rounded border border-[#ccc] p-2">
                <Text small bold variant="primary" className="mb-1 block">Permissions</Text>
                <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                    { [ 'allowStack', 'allowWalk', 'allowSit', 'allowLay', 'allowGift', 'allowTrade', 'allowRecycle', 'allowMarketplaceSell', 'allowInventoryStack' ].map(key => (
                        <label key={ key } className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={ (form as any)[key] }
                                onChange={ e => setField(key, e.target.checked) }
                            />
                            { key.replace('allow', '') }
                        </label>
                    )) }
                </div>
            </div>

            { /* Interaction */ }
            <div className="bg-white rounded border border-[#ccc] p-2">
                <Text small bold variant="primary" className="mb-1 block">Interaction</Text>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <label className={ labelClass }>Type</label>
                        <select className="form-select form-select-sm" value={ form.interactionType } onChange={ e => setField('interactionType', e.target.value) }>
                            <option value="">none</option>
                            { interactions.map(i => (
                                <option key={ i } value={ i }>{ i }</option>
                            )) }
                        </select>
                    </div>
                    <div>
                        <label className={ labelClass }>Modes</label>
                        <input type="number" className={ inputClass } value={ form.interactionModesCount } onChange={ e => setField('interactionModesCount', Number(e.target.value)) } />
                    </div>
                </div>
                <div className="mt-1">
                    <label className={ labelClass }>Custom Params</label>
                    <input className={ inputClass } value={ form.customparams } onChange={ e => setField('customparams', e.target.value) } />
                </div>
            </div>

            { /* Catalog References */ }
            { catalogItems.length > 0 &&
                <div className="bg-white rounded border border-[#ccc] p-2">
                    <Text small bold variant="primary" className="mb-1 block">Catalog ({ catalogItems.length })</Text>
                    <div className="text-[10px] space-y-0.5">
                        { catalogItems.map(ci => (
                            <div key={ ci.id } className="flex justify-between bg-[#f5f5f5] px-2 py-0.5 rounded">
                                <span>{ ci.catalogName } (page: { ci.pageName })</span>
                                <span>{ ci.costCredits }c + { ci.costPoints }p</span>
                            </div>
                        )) }
                    </div>
                </div>
            }

            { /* FurniData.json Entry */ }
            { furniDataEntry &&
                <div className="bg-white rounded border border-[#ccc] p-2">
                    <Text small bold variant="primary" className="mb-1 block">FurniData.json</Text>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                        { Object.entries(furniDataEntry).map(([ key, value ]) => (
                            <div key={ key } className="flex justify-between bg-[#f5f5f5] px-2 py-0.5 rounded">
                                <span className="font-bold text-[#555]">{ key }</span>
                                <span className="text-[#333] truncate ml-1 max-w-[120px] text-right">{ String(value ?? '') }</span>
                            </div>
                        )) }
                    </div>
                </div>
            }

            { /* Actions */ }
            <Flex gap={ 1 } justifyContent="between" className="mt-1">
                <Button variant="success" disabled={ loading } onClick={ handleSave }>
                    { loading ? 'Saving...' : 'Save' }
                </Button>
                <Button
                    variant={ confirmDelete ? 'danger' : 'warning' }
                    disabled={ loading || item.usageCount > 0 }
                    onClick={ handleDelete }
                >
                    { confirmDelete ? 'Confirm Delete' : 'Delete' }
                </Button>
            </Flex>
        </Column>
    );
};
