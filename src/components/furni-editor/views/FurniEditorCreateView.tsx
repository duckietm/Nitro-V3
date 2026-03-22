import { FC, useCallback, useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Column } from '../../../common';

interface FurniEditorCreateViewProps
{
    interactions: string[];
    loading: boolean;
    lastResult: { success: boolean; message: string; id: number } | null;
    onCreate: (fields: Record<string, unknown>) => void;
    onCreated: (id: number) => void;
}

const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors w-full';
const labelClass = 'text-[9px] text-[#666] uppercase font-bold mb-0.5 block';

export const FurniEditorCreateView: FC<FurniEditorCreateViewProps> = props =>
{
    const { interactions, loading, lastResult, onCreate, onCreated } = props;
    const [ toast, setToast ] = useState<{ type: 'success' | 'error'; message: string; id?: number } | null>(null);

    const [ form, setForm ] = useState({
        itemName: '',
        publicName: '',
        spriteId: 0,
        type: 's' as 's' | 'i',
        width: 1,
        length: 1,
        stackHeight: 0,
        allowStack: true,
        allowSit: false,
        allowLay: false,
        allowWalk: false,
        allowGift: true,
        allowTrade: true,
        allowRecycle: true,
        allowMarketplaceSell: true,
        allowInventoryStack: true,
        interactionType: '',
        interactionModesCount: 1,
        customparams: '',
    });

    useEffect(() =>
    {
        if(!lastResult) return;

        if(lastResult.success && lastResult.id > 0)
        {
            setToast({ type: 'success', message: `Item created with ID #${ lastResult.id }`, id: lastResult.id });
            setTimeout(() => onCreated(lastResult.id), 1500);
        }
        else if(!lastResult.success)
        {
            setToast({ type: 'error', message: lastResult.message });
        }

        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [ lastResult ]);

    const setField = useCallback((key: string, value: unknown) =>
    {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleCreate = useCallback(() =>
    {
        if(!form.itemName || !form.publicName) return;
        onCreate(form);
    }, [ form, onCreate ]);

    return (
        <Column gap={ 1 } className="h-full overflow-auto">
            { /* Toast */ }
            { toast &&
                <div className={ `rounded px-3 py-1.5 text-[11px] font-bold text-white ${ toast.type === 'success' ? 'bg-[#28a745]' : 'bg-[#dc3545]' }` }>
                    { toast.message }
                </div>
            }

            { /* Basic Info */ }
            <div className="border-2 border-card-grid-item-border rounded overflow-hidden">
                <div className="px-2.5 py-1.5 bg-[#f0f4f7]">
                    <span className="text-[9px] text-primary uppercase font-bold tracking-wide">Basic Info</span>
                </div>
                <div className="p-2.5 bg-white grid grid-cols-2 gap-2">
                    <div>
                        <label className={ labelClass }>Item Name *</label>
                        <input className={ inputClass } value={ form.itemName } onChange={ e => setField('itemName', e.target.value) } placeholder="my_custom_furni" />
                    </div>
                    <div>
                        <label className={ labelClass }>Public Name *</label>
                        <input className={ inputClass } value={ form.publicName } onChange={ e => setField('publicName', e.target.value) } placeholder="My Custom Furni" />
                    </div>
                    <div>
                        <label className={ labelClass }>Sprite ID</label>
                        <input type="number" className={ inputClass } value={ form.spriteId } onChange={ e => setField('spriteId', Number(e.target.value)) } />
                    </div>
                    <div>
                        <label className={ labelClass }>Type</label>
                        <select className={ inputClass } value={ form.type } onChange={ e => setField('type', e.target.value) }>
                            <option value="s">Floor (s)</option>
                            <option value="i">Wall (i)</option>
                        </select>
                    </div>
                </div>
            </div>

            { /* Dimensions */ }
            <div className="border-2 border-card-grid-item-border rounded overflow-hidden">
                <div className="px-2.5 py-1.5 bg-[#f0f4f7]">
                    <span className="text-[9px] text-primary uppercase font-bold tracking-wide">Dimensions</span>
                </div>
                <div className="p-2.5 bg-white grid grid-cols-3 gap-2">
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
            <div className="border-2 border-card-grid-item-border rounded overflow-hidden">
                <div className="px-2.5 py-1.5 bg-[#f0f4f7]">
                    <span className="text-[9px] text-primary uppercase font-bold tracking-wide">Permissions</span>
                </div>
                <div className="p-2.5 bg-white grid grid-cols-3 gap-x-3 gap-y-1.5">
                    { [ 'allowStack', 'allowWalk', 'allowSit', 'allowLay', 'allowGift', 'allowTrade', 'allowRecycle', 'allowMarketplaceSell', 'allowInventoryStack' ].map(key => (
                        <label key={ key } className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:text-primary transition-colors">
                            <input
                                type="checkbox"
                                className="accent-primary"
                                checked={ (form as any)[key] }
                                onChange={ e => setField(key, e.target.checked) }
                            />
                            { key.replace('allow', '') }
                        </label>
                    )) }
                </div>
            </div>

            { /* Interaction */ }
            <div className="border-2 border-card-grid-item-border rounded overflow-hidden">
                <div className="px-2.5 py-1.5 bg-[#f0f4f7]">
                    <span className="text-[9px] text-primary uppercase font-bold tracking-wide">Interaction</span>
                </div>
                <div className="p-2.5 bg-white">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className={ labelClass }>Type</label>
                            <select className={ inputClass } value={ form.interactionType } onChange={ e => setField('interactionType', e.target.value) }>
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
                    <div className="mt-2">
                        <label className={ labelClass }>Custom Params</label>
                        <input className={ inputClass } value={ form.customparams } onChange={ e => setField('customparams', e.target.value) } />
                    </div>
                </div>
            </div>

            { /* Create Button */ }
            <div className="pt-1">
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold bg-[#28a745] text-white hover:bg-[#218838] transition-colors cursor-pointer disabled:opacity-50"
                    disabled={ loading || !form.itemName || !form.publicName }
                    onClick={ handleCreate }
                >
                    <FaPlus className="text-[9px]" /> { loading ? 'Creating...' : 'Create Item' }
                </button>
            </div>
        </Column>
    );
};
