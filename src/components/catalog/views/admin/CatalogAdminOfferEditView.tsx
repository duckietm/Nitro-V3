import { FC, useEffect, useState } from 'react';
import { FaCubes, FaSave, FaSpinner, FaTrash } from 'react-icons/fa';
import { GetConfigurationValue, IPurchasableOffer, LocalizeText, ProductTypeEnum, localizeWithFallback } from '../../../../api';
import { useCatalogData } from '../../../../hooks';
import { IOfferEditData, useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogAdminModalView } from './CatalogAdminModalView';
import { CatalogAdminOfferPriceView } from './CatalogAdminOfferPriceView';

const getOfferIconUrl = (offer: IPurchasableOffer | null): string | null => {
    const product = offer?.product;
    if (!product) return null;

    if (product.productType === ProductTypeEnum.FLOOR || product.productType === ProductTypeEnum.WALL) {
        const className = product.furnitureData?.className;

        if (className?.length) {
            let param = '';

            if (product.productType === ProductTypeEnum.WALL && product.extraParam?.length) {
                param = `_${product.extraParam}`;
            } else if (product.productType === ProductTypeEnum.FLOOR && product.furnitureData?.hasIndexedColor && product.furnitureData.colorIndex > 0) {
                param = `_${product.furnitureData.colorIndex}`;
            }

            const configuredIconUrl = GetConfigurationValue<string>('furni.asset.icon.url', '');
            if (configuredIconUrl?.length) return configuredIconUrl.replace('%libname%', className).replace('%param%', param);
        }
    }

    return product.getIconUrl(offer) ?? null;
};

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
    };

    const handleDelete = () => {
        if (isNew || !deleteOffer || !confirm(LocalizeText('catalog.admin.delete.offer.confirm'))) return;

        deleteOffer(editingOffer.offerId);
    };

    const inputClass = 'nitro-catalog-admin-input';
    const previewIconUrl = isNew ? null : getOfferIconUrl(editingOffer);
    const previewName = catalogName || editingOffer.localizationName || (isNew ? localizeWithFallback('catalog.admin.offer.new', 'New offer') : `#${editingOffer.offerId}`);
    const previewFallbackIcon = isNew ? null : editingOffer.product?.getIconUrl(editingOffer);

    return (
        <CatalogAdminModalView
            title={isNew ? LocalizeText('catalog.admin.offer.new') : localizeWithFallback('catalog.admin.edit.offer', 'Edit offer')}
            widthClassName="w-[500px]"
            onClose={() => setEditingOffer(null)}
        >
            <div className="nitro-catalog-admin-form">
                <div className="nitro-catalog-admin-form-sheet">
                    <div className="nitro-catalog-admin-form-scroll">
                        <div className="nitro-catalog-admin-form-hero">
                            <span className="nitro-catalog-admin-offer-preview-icon">
                                {previewIconUrl ? (
                                    <img
                                        alt=""
                                        draggable={false}
                                        src={previewIconUrl}
                                        onError={(event) => {
                                            if (previewFallbackIcon && event.currentTarget.src !== previewFallbackIcon) event.currentTarget.src = previewFallbackIcon;
                                            else event.currentTarget.style.visibility = 'hidden';
                                        }}
                                    />
                                ) : (
                                    <FaCubes className="nitro-catalog-admin-offer-preview-icon-empty" />
                                )}
                            </span>
                            <div className="nitro-catalog-admin-offer-preview-info">
                                <span className="nitro-catalog-admin-offer-preview-name" title={previewName}>
                                    {previewName}
                                </span>
                                <span className="nitro-catalog-admin-offer-preview-sub">
                                    {isNew ? localizeWithFallback('catalog.admin.offer.new', 'New offer') : `${localizeWithFallback('catalog.admin.offer.id', 'Offer ID')} #${editingOffer.offerId}`}
                                    {amount > 1 ? ` · x${amount}` : ''}
                                </span>
                                <span className="nitro-catalog-admin-offer-preview-price">
                                    <CatalogAdminOfferPriceView credits={costCredits} points={costPoints} pointsType={pointsType} />
                                    {costCredits <= 0 && costPoints <= 0 && <span className="is-free">{localizeWithFallback('generic.free', 'Free')}</span>}
                                </span>
                            </div>
                        </div>

                        <section className="nitro-catalog-admin-form-section">
                            <div className="nitro-catalog-admin-section-title">{localizeWithFallback('catalog.admin.offer.section.details', 'Details')}</div>
                            <div className="nitro-catalog-admin-form-field">
                                <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.name')}</label>
                                <input
                                    className={inputClass}
                                    placeholder={localizeWithFallback('catalog.admin.offer.name.placeholder', 'e.g. rare_dragon_lamp')}
                                    type="text"
                                    value={catalogName}
                                    onChange={(e) => setCatalogName(e.target.value)}
                                />
                            </div>
                            <div className="nitro-catalog-admin-form-grid is-3col">
                                <div className="nitro-catalog-admin-form-field is-span-3">
                                    <label className="nitro-catalog-admin-label is-field">{localizeWithFallback('catalog.admin.offer.item.ids', 'Item IDs')}</label>
                                    <input
                                        className={inputClass}
                                        placeholder={localizeWithFallback('catalog.admin.offer.item.ids.placeholder', '1234 or 100;200')}
                                        type="text"
                                        value={itemIds}
                                        onChange={(e) => setItemIds(e.target.value)}
                                    />
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.quantity')}</label>
                                    <input className={inputClass} min={1} type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 1)} />
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.order')}</label>
                                    <input className={inputClass} min={0} type="number" value={orderNumber} onChange={(e) => setOrderNumber(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{localizeWithFallback('catalog.admin.offer.id', 'Offer ID')}</label>
                                    <input className={inputClass} type="number" value={offerId} onChange={(e) => setOfferIdGroup(parseInt(e.target.value) || -1)} />
                                </div>
                            </div>
                        </section>

                        <section className="nitro-catalog-admin-form-section">
                            <div className="nitro-catalog-admin-section-title">{LocalizeText('catalog.admin.offer.prices')}</div>
                            <div className="nitro-catalog-admin-form-grid is-3col">
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.credits')}</label>
                                    <input className={inputClass} min={0} type="number" value={costCredits} onChange={(e) => setCostCredits(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.points')}</label>
                                    <input className={inputClass} min={0} type="number" value={costPoints} onChange={(e) => setCostPoints(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.points.type')}</label>
                                    <select className={inputClass} value={pointsType} onChange={(e) => setPointsType(parseInt(e.target.value))}>
                                        <option value={0}>{localizeWithFallback('catalog.admin.currency.duckets', 'Duckets')}</option>
                                        <option value={5}>{localizeWithFallback('catalog.admin.currency.diamonds', 'Diamonds')}</option>
                                        <option value={101}>{localizeWithFallback('catalog.admin.currency.seasonal', 'Seasonal')}</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="nitro-catalog-admin-form-section">
                            <div className="nitro-catalog-admin-section-title">{LocalizeText('catalog.admin.offer.options')}</div>
                            <div className="nitro-catalog-admin-form-grid is-3col">
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.club.only')}</label>
                                    <select className={inputClass} value={clubOnly} onChange={(e) => setClubOnly(e.target.value)}>
                                        <option value="0">{localizeWithFallback('generic.no', 'No')}</option>
                                        <option value="1">{localizeWithFallback('generic.yes', 'Yes')}</option>
                                    </select>
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{localizeWithFallback('catalog.admin.offer.limited.stack', 'Limited stack')}</label>
                                    <input className={inputClass} min={0} type="number" value={limitedStack} onChange={(e) => setLimitedStack(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="nitro-catalog-admin-form-field">
                                    <label className="nitro-catalog-admin-label is-field">{LocalizeText('catalog.admin.offer.extradata')}</label>
                                    <input
                                        className={inputClass}
                                        placeholder={LocalizeText('catalog.admin.offer.extradata')}
                                        type="text"
                                        value={extradata}
                                        onChange={(e) => setExtradata(e.target.value)}
                                    />
                                </div>
                            </div>
                            <label className="nitro-catalog-admin-form-toggle">
                                <input checked={haveOffer === '1'} id="haveOffer" type="checkbox" onChange={(e) => setHaveOffer(e.target.checked ? '1' : '0')} />
                                <span>{LocalizeText('catalog.admin.offer.have.offer')}</span>
                            </label>
                        </section>
                    </div>

                    <div className="nitro-catalog-admin-form-actions">
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
                </div>
            </div>
        </CatalogAdminModalView>
    );
};
