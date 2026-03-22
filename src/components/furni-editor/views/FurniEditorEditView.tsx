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
    onUpdate: (id: number, fields: Record<string, unknown>) => void;
    onDelete: (id: number) => void;
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
        description: '',
        revision: 0,
        category: '',
        defaultdir: 0,
        offerid: 0,
        buyout: false,
        rentofferid: 0,
        rentbuyout: false,
        bc: false,
        excludeddynamic: false,
        furniline: '',
        environment: '',
        rare: false,
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
            description: item.description || '',
            revision: item.revision || 0,
            category: item.category || '',
            defaultdir: item.defaultdir || 0,
            offerid: item.offerid || 0,
            buyout: !!item.buyout,
            rentofferid: item.rentofferid || 0,
            rentbuyout: !!item.rentbuyout,
            bc: !!item.bc,
            excludeddynamic: !!item.excludeddynamic,
            furniline: item.furniline || '',
            environment: item.environment || '',
            rare: !!item.rare,
        });

        setConfirmDelete(false);
    }, [ item ]);

    const setField = useCallback((key: string, value: unknown) =>
    {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = useCallback(() =>
    {
        onUpdate(item.id, form);
    }, [ item, form, onUpdate ]);

    const handleDelete = useCallback(() =>
    {
        if(!confirmDelete) return setConfirmDelete(true);

        onDelete(item.id);
        onBack();
    }, [ confirmDelete, item, onDelete, onBack ]);

    const inputClass = 'form-control form-control-sm';
    const labelClass = 'text-[11px] font-bold text-[#333] mb-0';

    return (
        <Column gap={ 1 } className="h-full overflow-auto">
            <Flex gap={ 1 } alignItems="center" className="mb-1">
                <Button variant="secondary" onClick={ onBack }>Back</Button>
                <Flex alignItems="center" gap={ 1 } className="bg-[#e9ecef] px-2 py-0.5 rounded">
                    <Text bold className="text-[12px]">ID: { item.id }</Text>
                    <span className="text-[#999] mx-0.5">|</span>
                    <Text bold className="text-[12px]">Sprite: { item.spriteId }</Text>
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
                    <div className="col-span-2">
                        <label className={ labelClass }>Description</label>
                        <textarea className={ inputClass } rows={ 2 } value={ form.description } onChange={ e => setField('description', e.target.value) } />
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
                <div className="grid grid-cols-4 gap-2">
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
                    <div>
                        <label className={ labelClass }>Default Dir</label>
                        <input type="number" className={ inputClass } value={ form.defaultdir } onChange={ e => setField('defaultdir', Number(e.target.value)) } />
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

            { /* FurniData JSON */ }
            <div className="bg-white rounded border border-[#ccc] p-2">
                <Text small bold variant="primary" className="mb-1 block">FurniData.json</Text>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className={ labelClass }>Revision</label>
                        <input type="number" className={ inputClass } value={ form.revision } onChange={ e => setField('revision', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Category</label>
                        <input className={ inputClass } value={ form.category } onChange={ e => setField('category', e.target.value) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Offer ID</label>
                        <input type="number" className={ inputClass } value={ form.offerid } onChange={ e => setField('offerid', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Rent Offer ID</label>
                        <input type="number" className={ inputClass } value={ form.rentofferid } onChange={ e => setField('rentofferid', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Furniline</label>
                        <input className={ inputClass } value={ form.furniline } onChange={ e => setField('furniline', e.target.value) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Environment</label>
                        <input className={ inputClass } value={ form.environment } onChange={ e => setField('environment', e.target.value) } />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-x-3 gap-y-1 mt-1">
                    { [
                        ['buyout', 'Buyout'],
                        ['rentbuyout', 'Rent Buyout'],
                        ['bc', 'BC'],
                        ['excludeddynamic', 'Excl. Dynamic'],
                        ['rare', 'Rare']
                    ].map(([ key, label ]) => (
                        <label key={ key } className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={ (form as any)[key] }
                                onChange={ e => setField(key, e.target.checked) }
                            />
                            { label }
                        </label>
                    )) }
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
