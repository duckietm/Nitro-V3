import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaSave, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { IOfferEditData, useCatalogAdmin } from '../../CatalogAdminContext';

export const CatalogAdminOfferEditView: FC<{}> = () =>
{
    const { currentPage = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const editingOffer = catalogAdmin?.editingOffer ?? null;
    const setEditingOffer = catalogAdmin?.setEditingOffer;
    const saveOffer = catalogAdmin?.saveOffer;
    const deleteOffer = catalogAdmin?.deleteOffer;
    const createOffer = catalogAdmin?.createOffer;
    const loading = catalogAdmin?.loading ?? false;

    const [ itemIds, setItemIds ] = useState('0');
    const [ catalogName, setCatalogName ] = useState('');
    const [ costCredits, setCostCredits ] = useState(0);
    const [ costPoints, setCostPoints ] = useState(0);
    const [ pointsType, setPointsType ] = useState(0);
    const [ amount, setAmount ] = useState(1);
    const [ clubOnly, setClubOnly ] = useState('0');
    const [ extradata, setExtradata ] = useState('');
    const [ haveOffer, setHaveOffer ] = useState('1');
    const [ offerId, setOfferIdGroup ] = useState(-1);
    const [ limitedStack, setLimitedStack ] = useState(0);
    const [ orderNumber, setOrderNumber ] = useState(0);
    const [ isNew, setIsNew ] = useState(false);

    useEffect(() =>
    {
        if(!editingOffer) return;

        if(editingOffer.offerId === -1)
        {
            setIsNew(true);
            setItemIds('0');
            setCatalogName('');
            setCostCredits(0);
            setCostPoints(0);
            setPointsType(0);
            setAmount(1);
            setClubOnly('0');
            setExtradata('');
            setHaveOffer('1');
            setOfferIdGroup(-1);
            setLimitedStack(0);
            setOrderNumber(0);
        }
        else
        {
            setIsNew(false);
            setItemIds(String(editingOffer.product?.productClassId || 0));
            setCatalogName(editingOffer.localizationName || '');
            setCostCredits(editingOffer.priceInCredits);
            setCostPoints(editingOffer.priceInActivityPoints);
            setPointsType(editingOffer.activityPointType);
            setAmount(editingOffer.product?.productCount || 1);
            setClubOnly(editingOffer.clubLevel > 0 ? '1' : '0');
            setExtradata(editingOffer.product?.extraParam || '');
            setHaveOffer('1');
            setOfferIdGroup(editingOffer.offerId || -1);
            setLimitedStack(0);
            setOrderNumber(0);
        }
    }, [ editingOffer ]);

    if(!editingOffer) return null;

    const handleSave = async () =>
    {
        if(!saveOffer || !createOffer) return;

        const data: IOfferEditData = {
            offerId: isNew ? undefined : editingOffer.offerId,
            pageId: currentPage?.pageId || 0,
            itemIds,
            catalogName,
            costCredits,
            costPoints,
            pointsType,
            amount,
            clubOnly,
            extradata,
            haveOffer,
            offerId_group: offerId,
            limitedStack,
            orderNumber
        };

        const success = isNew ? await createOffer(data) : await saveOffer(data);

        if(success && setEditingOffer) setEditingOffer(null);
    };

    const handleDelete = () =>
    {
        if(isNew || !deleteOffer || !confirm(LocalizeText('catalog.admin.delete.offer.confirm'))) return;

        deleteOffer(editingOffer.offerId);
        if(setEditingOffer) setEditingOffer(null);
    };

    const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors';

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={ { zIndex: 1000 } } onClick={ () => setEditingOffer(null) }>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            <div className="nitro-card-shell relative w-[420px] overflow-hidden shadow-lg" onClick={ e => e.stopPropagation() }>
                { /* Header */ }
                <div className="nitro-card-header-shell flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-bold text-white">
                        { isNew ? LocalizeText('catalog.admin.offer.new') : `${ LocalizeText('catalog.admin.offer.edit') } #${ editingOffer.offerId }` }
                    </span>
                    <div className="cursor-pointer" onClick={ () => setEditingOffer(null) }>
                        <FaTimes className="text-white/70 hover:text-white text-xs" />
                    </div>
                </div>

                <div className="p-3 flex flex-col gap-2.5">
                    { /* Current name */ }
                    { !isNew &&
                        <div className="text-[10px] text-muted bg-card-grid-item rounded px-2.5 py-1 font-mono border border-card-grid-item-border">
                            { editingOffer.localizationName }
                        </div> }

                    { /* Catalog Name */ }
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-primary uppercase font-bold">{ LocalizeText('catalog.admin.offer.name') }</label>
                        <input className={ inputClass } placeholder="es. rare_dragon_lamp" type="text" value={ catalogName } onChange={ e => setCatalogName(e.target.value) } />
                    </div>

                    { /* Generale */ }
                    <div className="bg-white rounded border-2 border-card-grid-item-border p-2.5">
                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5">{ LocalizeText('catalog.admin.offer.general') }</div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">Item IDs</label>
                                <input className={ inputClass } placeholder="1234" type="text" value={ itemIds } onChange={ e => setItemIds(e.target.value) } />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.offer.quantity') }</label>
                                <input className={ inputClass } min={ 1 } type="number" value={ amount } onChange={ e => setAmount(parseInt(e.target.value) || 1) } />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.order') }</label>
                                <input className={ inputClass } min={ 0 } type="number" value={ orderNumber } onChange={ e => setOrderNumber(parseInt(e.target.value) || 0) } />
                            </div>
                        </div>
                    </div>

                    { /* Prezzi */ }
                    <div className="bg-white rounded border-2 border-card-grid-item-border p-2.5">
                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5">{ LocalizeText('catalog.admin.offer.prices') }</div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.offer.credits') }</label>
                                <input className={ inputClass } min={ 0 } type="number" value={ costCredits } onChange={ e => setCostCredits(parseInt(e.target.value) || 0) } />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.offer.points') }</label>
                                <input className={ inputClass } min={ 0 } type="number" value={ costPoints } onChange={ e => setCostPoints(parseInt(e.target.value) || 0) } />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.offer.points.type') }</label>
                                <select className={ inputClass } value={ pointsType } onChange={ e => setPointsType(parseInt(e.target.value)) }>
                                    <option value={ 0 }>Duckets</option>
                                    <option value={ 5 }>Diamonds</option>
                                    <option value={ 101 }>Seasonal</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    { /* Opzioni */ }
                    <div className="bg-white rounded border-2 border-card-grid-item-border p-2.5">
                        <div className="text-[9px] text-primary uppercase font-bold mb-1.5">{ LocalizeText('catalog.admin.offer.options') }</div>
                        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.offer.club.only') }</label>
                                <select className={ inputClass } value={ clubOnly } onChange={ e => setClubOnly(e.target.value) }>
                                    <option value="0">No</option>
                                    <option value="1">Si</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">Limited Stack</label>
                                <input className={ inputClass } min={ 0 } type="number" value={ limitedStack } onChange={ e => setLimitedStack(parseInt(e.target.value) || 0) } />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-muted">Offer ID</label>
                                <input className={ inputClass } type="number" value={ offerId } onChange={ e => setOfferIdGroup(parseInt(e.target.value) || -1) } />
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-muted">{ LocalizeText('catalog.admin.offer.extradata') }</label>
                            <input className={ inputClass } placeholder="dati extra (opzionale)" type="text" value={ extradata } onChange={ e => setExtradata(e.target.value) } />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <input className="accent-primary" checked={ haveOffer === '1' } id="haveOffer" type="checkbox" onChange={ e => setHaveOffer(e.target.checked ? '1' : '0') } />
                            <label className="text-[10px] cursor-pointer" htmlFor="haveOffer">{ LocalizeText('catalog.admin.offer.have.offer') }</label>
                        </div>
                    </div>

                    { /* Actions */ }
                    <div className="flex justify-between">
                        { !isNew
                            ? <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer" onClick={ handleDelete }>
                                <FaTrash className="text-[8px]" /> { LocalizeText('catalog.admin.delete') }
                            </button>
                            : <div /> }
                        <button className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50" disabled={ loading } onClick={ handleSave }>
                            { loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" /> } { isNew ? LocalizeText('catalog.admin.create') : LocalizeText('catalog.admin.save') }
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
