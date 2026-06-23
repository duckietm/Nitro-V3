import { FC, useEffect, useState } from 'react';
import { FaSave, FaSpinner, FaTrash } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useCatalogData } from '../../../../hooks';
import { IOfferEditData, useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogAdminModalView } from './CatalogAdminModalView';

export const CatalogAdminOfferEditView: FC<{}> = () => {
    const { currentPage = null } = useCatalogData();
    const catalogAdmin = useCatalogAdmin();
    const editingOffer = catalogAdmin?.editingOffer ?? null;
    const editingOfferDetails = catalogAdmin?.editingOfferDetails ?? null;
    const setEditingOffer = catalogAdmin?.setEditingOffer;
    const saveOffer = catalogAdmin?.saveOffer;
    const deleteOffer = catalogAdmin?.deleteOffer;
    const createOffer = catalogAdmin?.createOffer;
    const loading = catalogAdmin?.loading ?? false;

    const [itemIds, setItemIds] = useState('');
    const [catalogName, setCatalogName] = useState('');
    const [costCredits, setCostCredits] = useState(0);
    const [costPoints, setCostPoints] = useState(0);
    const [pointsType, setPointsType] = useState(0);
    const [amount, setAmount] = useState(1);
    const [clubOnly, setClubOnly] = useState('0');
    const [extradata, setExtradata] = useState('');
    const [haveOffer, setHaveOffer] = useState('1');
    const [offerId, setOfferIdGroup] = useState(-1);
    const [limitedStack, setLimitedStack] = useState(0);
    const [orderNumber, setOrderNumber] = useState(0);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        if (!editingOffer) return;

        if (editingOffer.offerId === -1) {
            setIsNew(true);
            setItemIds('');
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
        } else {
            setIsNew(false);
            setItemIds(editingOffer.itemIds || '');
            setCatalogName(editingOffer.localizationName || '');
            setCostCredits(editingOffer.priceInCredits);
            setCostPoints(editingOffer.priceInActivityPoints);
            setPointsType(editingOffer.activityPointType);
            setAmount(editingOffer.product?.productCount || 1);
            setClubOnly(editingOffer.clubLevel > 0 ? '1' : '0');
            setExtradata(editingOffer.product?.extraParam || '');
            setHaveOffer(editingOffer.haveOffer ? '1' : '0');
            setOfferIdGroup(0);
            setLimitedStack(0);
            setOrderNumber(0);
        }
    }, [editingOffer]);

    useEffect(() => {
        if (!editingOfferDetails) return;

        setOfferIdGroup(editingOfferDetails.offerIdGroup);
        setLimitedStack(editingOfferDetails.limitedStack);
        setOrderNumber(editingOfferDetails.orderNumber);
    }, [editingOfferDetails]);

    if (!editingOffer) return null;

    const handleSave = async () => {
        if (!saveOffer || !createOffer) return;

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

        if (isNew) createOffer(data);
        else saveOffer(data);

        if (setEditingOffer) setEditingOffer(null);
    };

    const handleDelete = () => {
        if (isNew || !deleteOffer || !confirm(LocalizeText('catalog.admin.delete.offer.confirm'))) return;

        deleteOffer(editingOffer.offerId);
        if (setEditingOffer) setEditingOffer(null);
    };

    const inputClass = 'nitro-catalog-admin-input';

    return (
        <CatalogAdminModalView
            title={isNew ? LocalizeText('catalog.admin.offer.new') : `${LocalizeText('catalog.admin.offer.edit')} #${editingOffer.offerId}`}
            widthClassName="w-[420px]"
            onClose={() => setEditingOffer(null)}
        >
            {/* Current name */}
            {!isNew && <div className="nitro-catalog-admin-note font-mono">{editingOffer.localizationName}</div>}

            {/* Catalog Name */}
            <div className="flex flex-col gap-0.5">
                <label className="nitro-catalog-admin-label is-primary">{LocalizeText('catalog.admin.offer.name')}</label>
                <input
                    className={inputClass}
                    placeholder="es. rare_dragon_lamp"
                    type="text"
                    value={catalogName}
                    onChange={(e) => setCatalogName(e.target.value)}
                />
            </div>

            {/* Generale */}
            <div className="nitro-catalog-admin-panel">
                <div className="nitro-catalog-admin-section-title">{LocalizeText('catalog.admin.offer.general')}</div>
                <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">Item IDs</label>
                        <input className={inputClass} placeholder="1234 or 100;200" type="text" value={itemIds} onChange={(e) => setItemIds(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.offer.quantity')}</label>
                        <input className={inputClass} min={1} type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.order')}</label>
                        <input
                            className={inputClass}
                            min={0}
                            type="number"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>

            {/* Prezzi */}
            <div className="nitro-catalog-admin-panel">
                <div className="nitro-catalog-admin-section-title">{LocalizeText('catalog.admin.offer.prices')}</div>
                <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.offer.credits')}</label>
                        <input
                            className={inputClass}
                            min={0}
                            type="number"
                            value={costCredits}
                            onChange={(e) => setCostCredits(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.offer.points')}</label>
                        <input className={inputClass} min={0} type="number" value={costPoints} onChange={(e) => setCostPoints(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.offer.points.type')}</label>
                        <select className={inputClass} value={pointsType} onChange={(e) => setPointsType(parseInt(e.target.value))}>
                            <option value={0}>Duckets</option>
                            <option value={5}>Diamonds</option>
                            <option value={101}>Seasonal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Opzioni */}
            <div className="nitro-catalog-admin-panel">
                <div className="nitro-catalog-admin-section-title">{LocalizeText('catalog.admin.offer.options')}</div>
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.offer.club.only')}</label>
                        <select className={inputClass} value={clubOnly} onChange={(e) => setClubOnly(e.target.value)}>
                            <option value="0">No</option>
                            <option value="1">Si</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">Limited Stack</label>
                        <input
                            className={inputClass}
                            min={0}
                            type="number"
                            value={limitedStack}
                            onChange={(e) => setLimitedStack(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="nitro-catalog-admin-label">Offer ID</label>
                        <input className={inputClass} type="number" value={offerId} onChange={(e) => setOfferIdGroup(parseInt(e.target.value) || -1)} />
                    </div>
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="nitro-catalog-admin-label">{LocalizeText('catalog.admin.offer.extradata')}</label>
                    <input
                        className={inputClass}
                        placeholder={LocalizeText('catalog.admin.offer.extradata')}
                        type="text"
                        value={extradata}
                        onChange={(e) => setExtradata(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                        className="accent-primary"
                        checked={haveOffer === '1'}
                        id="haveOffer"
                        type="checkbox"
                        onChange={(e) => setHaveOffer(e.target.checked ? '1' : '0')}
                    />
                    <label className="nitro-catalog-admin-check-label" htmlFor="haveOffer">
                        {LocalizeText('catalog.admin.offer.have.offer')}
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                {!isNew ? (
                    <button className="nitro-catalog-admin-button is-danger" onClick={handleDelete}>
                        <FaTrash className="text-[8px]" /> {LocalizeText('catalog.admin.delete')}
                    </button>
                ) : (
                    <div />
                )}
                <button className="nitro-catalog-admin-button is-primary" disabled={loading} onClick={handleSave}>
                    {loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" />}{' '}
                    {isNew ? LocalizeText('catalog.admin.create') : LocalizeText('catalog.admin.save')}
                </button>
            </div>
        </CatalogAdminModalView>
    );
};
