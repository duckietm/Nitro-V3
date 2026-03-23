import { FC, useCallback, useEffect, useState } from 'react';
import { FaSave, FaSync, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { Column } from '../../../common';
import { LayoutFurniIconImageView } from '../../../common/layout/LayoutFurniIconImageView';
import { CatalogRef, FurniDetail } from '../../../hooks/furni-editor';

interface FurniEditorEditViewProps
{
    item: FurniDetail;
    catalogItems: CatalogRef[];
    furniDataEntry: Record<string, unknown> | null;
    interactions: string[];
    loading: boolean;
    lastResult: { success: boolean; message: string; id: number } | null;
    onUpdate: (id: number, fields: Record<string, unknown>) => void;
    onDelete: (id: number) => void;
    onBack: () => void;
    onRefresh: (id: number) => void;
}

const ic = 'text-[13px] border border-[#c5cdd6] rounded px-2 py-1 bg-white focus:outline-none focus:border-[#1e7295] focus:shadow-[0_0_0_1px_rgba(30,114,149,0.15)] transition-all w-full';
const ro = 'text-[13px] border border-[#d5dbe0] rounded px-2 py-1 bg-[#f0f2f4] text-[#777] w-full cursor-not-allowed';
const lb = 'text-[11px] text-[#1e7295] uppercase font-bold tracking-wider leading-none';
const sectionTitle = 'text-[12px] text-[#1e7295] uppercase font-bold tracking-wider';

export const FurniEditorEditView: FC<FurniEditorEditViewProps> = props =>
{
    const { item, catalogItems, furniDataEntry, interactions, loading, lastResult, onUpdate, onDelete, onBack, onRefresh } = props;

    const [ form, setForm ] = useState({
        publicName: '',
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
    const [ toast, setToast ] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() =>
    {
        if(!item) return;

        setForm({
            publicName: item.publicName || '',
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

    useEffect(() =>
    {
        if(!lastResult) return;

        setToast({ type: lastResult.success ? 'success' : 'error', message: lastResult.message });
        if(lastResult.success && lastResult.id > 0) onRefresh(lastResult.id);

        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [ lastResult ]);

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
    }, [ confirmDelete, item, onDelete ]);

    return (
        <Column gap={ 0 } className="h-full overflow-auto">
            { toast &&
                <div className={ `rounded px-2 py-1 text-[12px] font-bold text-white mb-1.5 shadow-sm ${ toast.type === 'success' ? 'bg-[#28a745]' : 'bg-[#dc3545]' }` }>
                    { toast.message }
                </div>
            }

            { /* Header */ }
            <div className="flex items-center gap-3 mb-2 pb-2 border-b-2 border-[#c5cdd6]">
                <div className="w-[46px] h-[46px] flex items-center justify-center bg-white rounded-md border border-[#c5cdd6] flex-shrink-0 shadow-sm overflow-hidden">
                    <LayoutFurniIconImageView productType={ item.type } productClassId={ item.spriteId } style={ { transform: 'scale(1.2)' } } />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[#2d3748] truncate leading-tight">{ item.publicName }</div>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                        <span className="text-[#1e7295] font-bold cursor-pointer hover:underline" title="Click to copy ID" onClick={ () => { navigator.clipboard.writeText(String(item.id)); setToast({ type: 'success', message: `ID ${item.id} copied!` }); } }>#{item.id}</span>
                        <span className="text-[#d0d5db]">|</span>
                        <span className="text-[#4a5568]">sprite:<b>{ item.spriteId }</b></span>
                        <span className="text-[#d0d5db]">|</span>
                        <span className="truncate max-w-[140px] text-[#4a5568]">{ item.itemName }</span>
                        <span className={ `px-2 py-[2px] rounded text-white text-[11px] font-bold ${ item.type === 's' ? 'bg-[#1e7295]' : 'bg-[#718096]' }` }>
                            { item.type === 's' ? 'FLOOR' : 'WALL' }
                        </span>
                        { item.usageCount > 0 && <span className="text-[#e53e3e] font-bold">{ item.usageCount } in use</span> }
                    </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <button className="p-1.5 rounded-md bg-[#edf2f7] hover:bg-[#e2e8f0] cursor-pointer transition-colors" onClick={ () => onRefresh(item.id) } title="Refresh">
                        <FaSync className="text-[9px] text-[#718096]" />
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-[#edf2f7] hover:bg-[#e2e8f0] text-[#4a5568] cursor-pointer transition-colors" onClick={ onBack }>
                        <FaArrowLeft className="text-[7px]" /> Back
                    </button>
                </div>
            </div>

            { /* Basic Info */ }
            <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 pb-2 border-b-2 border-[#c5cdd6]">
                <div>
                    <label className={ lb }>Item Name</label>
                    <input className={ ro } value={ item.itemName } readOnly />
                </div>
                <div>
                    <label className={ lb }>Public Name</label>
                    <input className={ ic } value={ form.publicName } onChange={ e => setField('publicName', e.target.value) } />
                </div>
                <div>
                    <label className={ lb }>Sprite ID</label>
                    <input className={ ro } value={ item.spriteId } readOnly />
                </div>
                <div>
                    <label className={ lb }>Type</label>
                    <select className={ ic } value={ form.type } onChange={ e => setField('type', e.target.value) }>
                        <option value="s">Floor (s)</option>
                        <option value="i">Wall (i)</option>
                    </select>
                </div>
            </div>

            { /* Dimensions */ }
            <div className="pt-2 pb-2 border-b-2 border-[#c5cdd6]">
                <div className={ sectionTitle + ' mb-1' }>Dimensions</div>
                <div className="grid grid-cols-3 gap-x-2">
                    <div>
                        <label className={ lb }>Width</label>
                        <input type="number" className={ ic } value={ form.width } onChange={ e => setField('width', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ lb }>Length</label>
                        <input type="number" className={ ic } value={ form.length } onChange={ e => setField('length', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ lb }>Stack Height</label>
                        <input type="number" step="0.01" className={ ic } value={ form.stackHeight } onChange={ e => setField('stackHeight', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Default Dir</label>
                        <input type="number" className={ inputClass } value={ form.defaultdir } onChange={ e => setField('defaultdir', Number(e.target.value)) } />
                    </div>
                </div>
            </div>

            { /* Permissions */ }
            <div className="pt-2 pb-2 border-b-2 border-[#c5cdd6]">
                <div className={ sectionTitle + ' mb-1' }>Permissions</div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-[3px]">
                    { [ 'allowStack', 'allowWalk', 'allowSit', 'allowLay', 'allowGift', 'allowTrade', 'allowRecycle', 'allowMarketplaceSell', 'allowInventoryStack' ].map(key => (
                        <label key={ key } className="flex items-center gap-1 text-[12px] text-[#4a5568] cursor-pointer hover:text-[#1e7295] transition-colors">
                            <input type="checkbox" className="accent-[#1e7295] w-3 h-3" checked={ (form as any)[key] } onChange={ e => setField(key, e.target.checked) } />
                            { key.replace('allow', '') }
                        </label>
                    )) }
                </div>
            </div>

            { /* Interaction */ }
            <div className="pt-2">
                <div className={ sectionTitle + ' mb-1' }>Interaction</div>
                <div className="grid grid-cols-4 gap-x-2">
                    <div className="col-span-2">
                        <label className={ lb }>Type</label>
                        <select className={ ic } value={ form.interactionType } onChange={ e => setField('interactionType', e.target.value) }>
                            <option value="">none</option>
                            { interactions.map(i => <option key={ i } value={ i }>{ i }</option>) }
                        </select>
                    </div>
                    <div>
                        <label className={ lb }>Modes</label>
                        <input type="number" className={ ic } value={ form.interactionModesCount } onChange={ e => setField('interactionModesCount', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ lb }>Custom Params</label>
                        <input className={ ic } value={ form.customparams } onChange={ e => setField('customparams', e.target.value) } />
                    </div>
                </div>
            </div>

            { /* Actions */ }
            <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#e2e8f0]">
                <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-bold bg-[#28a745] text-white hover:bg-[#218838] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    disabled={ loading }
                    onClick={ handleSave }
                >
                    <FaSave className="text-[8px]" /> { loading ? 'Saving...' : 'Save' }
                </button>
                <button
                    className={ `flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 ${ confirmDelete ? 'bg-[#dc3545] hover:bg-[#c82333]' : 'bg-[#e8993e] hover:bg-[#d98a30]' }` }
                    disabled={ loading || item.usageCount > 0 }
                    onClick={ handleDelete }
                >
                    <FaTrash className="text-[8px]" /> { confirmDelete ? 'Confirm' : 'Delete' }
                </button>
            </div>
        </Column>
    );
};
