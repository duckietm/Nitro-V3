import {
    ChestDataEvent,
    ChestDepositComposer,
    ChestDepositInventoryItemComposer,
    ChestFurniChunkEvent,
    ChestFurniDeltaEvent,
    ChestLogEvent,
    ChestRequestLogComposer,
    ChestSaveNotificationsComposer,
    ChestSaveSettingsComposer,
    ChestStartDepositComposer,
    ChestUpgradeCapacityComposer,
    ChestWithdrawAllFurniComposer,
    ChestWithdrawComposer,
    ChestWithdrawFurniComposer,
    FurnitureListComposer,
    FurnitureType,
    GetSessionDataManager,
    IChestFurniStoredItem,
} from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, ProductImageUtility, SendMessageComposer } from '../../../../api';
import { Column, Flex, LayoutCurrencyIcon, LayoutFurniImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { ChestButton } from './ChestButton';
import { useMessageEvent } from '../../../../hooks';
import { useInventoryFurni } from '../../../../hooks/inventory';
import sceneZero from '../../../../assets/images/chest/light_coins_chest_balance_zero.png';
import sceneLow from '../../../../assets/images/chest/light_coins_chest_balance_low.png';
import sceneMedium from '../../../../assets/images/chest/light_coins_chest_balance_medium.png';
import sceneHigh from '../../../../assets/images/chest/light_coins_chest_balance_high.png';
import bellIcon from '../../../../assets/images/chest/wired_chests_bell_icon.png';
import gearIcon from '../../../../assets/images/chest/wired_chests_gear_icon.png';
import furniEmptyScene from '../../../../assets/images/chest/variant_furni_chest_empty.png';

interface ChestEntry {
    currencyType: number;
    amount: number;
}

interface ChestFurniEntry {
    baseItemId: number;
    quantity: number;
}

interface ChestLogRow {
    type: string;
    timestamp: number;
    userName: string;
    withdrawn: number;
    deposited: number;
}

const CREDITS = -1;
const CHEST_KIND_FURNI = 1;
const UPGRADE_STEP = 5000;
const FURNI_SEARCH_THRESHOLD = 31;

const furniName = (baseItemId: number): string => {
    const data = GetSessionDataManager().getFloorItemData(baseItemId);
    return data?.name || `#${baseItemId}`;
};
const COST_CREDITS = 10;
const COST_DIAMONDS = 10;

const groupStoredFurni = (items: IChestFurniStoredItem[]): ChestFurniEntry[] => {
    const counts = new Map<number, number>();

    for (const item of items) {
        counts.set(item.baseItemId, (counts.get(item.baseItemId) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([baseItemId, quantity]) => ({ baseItemId, quantity }));
};

export const FurnitureChestView: FC = () => {
    const [itemId, setItemId] = useState(-1);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [capacityMax, setCapacityMax] = useState(5000);
    const [used, setUsed] = useState(0);
    const [accessOpen, setAccessOpen] = useState(true);
    const [accessDonate, setAccessDonate] = useState(false);
    const [appearanceState, setAppearanceState] = useState(0);
    const [notifyFull, setNotifyFull] = useState(false);
    const [notifyDonation, setNotifyDonation] = useState(false);
    const [notifyWithdraw, setNotifyWithdraw] = useState(false);
    const [notifyEmpty, setNotifyEmpty] = useState(false);
    const [notifyWired, setNotifyWired] = useState(false);
    const [notifyMode, setNotifyMode] = useState(0);
    const [entries, setEntries] = useState<ChestEntry[]>([]);
    const [chestKind, setChestKind] = useState(0);
    const [furniEntries, setFurniEntries] = useState<ChestFurniEntry[]>([]);
    const [storedFurniItems, setStoredFurniItems] = useState<IChestFurniStoredItem[]>([]);
    const [selectedFurni, setSelectedFurni] = useState(-1);
    const [furniWithdrawAmount, setFurniWithdrawAmount] = useState(1);

    const [withdrawAmount, setWithdrawAmount] = useState(1);
    const [depositOpen, setDepositOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState(0);

    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [logRows, setLogRows] = useState<ChestLogRow[]>([]);
    const [upgradeQty, setUpgradeQty] = useState(1);
    const [confirmWithdrawAll, setConfirmWithdrawAll] = useState(false);
    const [depositFurniOpen, setDepositFurniOpen] = useState(false);
    const [furniSearch, setFurniSearch] = useState('');

    const { groupItems = [] } = useInventoryFurni();

    const appearanceOptions = useMemo(
        () => [
            { value: 0, label: LocalizeText('wiredchests.settings.appearance.state.0') },
            { value: 1, label: LocalizeText('wiredchests.settings.appearance.state.1') },
            { value: 2, label: LocalizeText('wiredchests.settings.appearance.state.2') },
        ],
        [],
    );

    const notifyModes = useMemo(
        () => [
            { value: 0, label: LocalizeText('wiredchests.notification_settings.notification_mode.when.0') },
            { value: 1, label: LocalizeText('wiredchests.notification_settings.notification_mode.when.1') },
            { value: 2, label: LocalizeText('wiredchests.notification_settings.notification_mode.when.2') },
        ],
        [],
    );

    const depositableInventoryItems = useMemo(() => {
        const rows: { id: number; baseItemId: number; name: string }[] = [];
        for (const g of groupItems) {
            if (g.isWallItem) continue;
            for (const item of g.items) {
                if (item.locked) continue;
                rows.push({ id: item.id, baseItemId: g.type, name: g.name });
            }
        }
        return rows;
    }, [groupItems]);

    const visibleFurniEntries = useMemo(() => {
        const q = furniSearch.trim().toLowerCase();
        if (!q) return furniEntries;
        return furniEntries.filter((f) => furniName(f.baseItemId).toLowerCase().includes(q));
    }, [furniEntries, furniSearch]);

    useEffect(() => {
        if (!depositFurniOpen) return;
        SendMessageComposer(new FurnitureListComposer());
        SendMessageComposer(new ChestStartDepositComposer(itemId));
    }, [depositFurniOpen, itemId]);

    const applyStoredFurni = useCallback((items: IChestFurniStoredItem[]) => {
        setStoredFurniItems(items);
        const grouped = groupStoredFurni(items);
        setFurniEntries(grouped);
        setSelectedFurni((prev) =>
            grouped.some((f) => f.baseItemId === prev) ? prev : grouped.length ? grouped[0].baseItemId : -1,
        );
    }, []);

    useMessageEvent<ChestDataEvent>(ChestDataEvent, (event) => {
        const p = event.getParser();
        setItemId(p.itemId);
        setName(p.name);
        setDescription(p.description);
        setCapacityMax(p.capacityMax);
        setUsed(p.used);
        setAccessOpen(p.accessOpen);
        setAccessDonate(p.accessDonate);
        setAppearanceState(p.appearanceState);
        setNotifyFull(p.notifyFull);
        setNotifyDonation(p.notifyDonation);
        setNotifyWithdraw(p.notifyWithdraw);
        setNotifyEmpty(p.notifyEmpty);
        setNotifyWired(p.notifyWired);
        setNotifyMode(p.notifyMode);
        setEntries(p.entries.map((e) => ({ currencyType: e.currencyType, amount: e.amount })));
        setChestKind(p.chestKind);
        if (p.chestKind === CHEST_KIND_FURNI) {
            // v2: item rows arrive via ChestFurniChunkEvent after this shell packet
            applyStoredFurni([]);
        } else {
            const furni = p.furniEntries.map((e) => ({ baseItemId: e.baseItemId, quantity: e.quantity }));
            setFurniEntries(furni);
            setSelectedFurni((prev) =>
                furni.some((f) => f.baseItemId === prev) ? prev : furni.length ? furni[0].baseItemId : -1,
            );
        }
    });

    useMessageEvent<ChestFurniChunkEvent>(ChestFurniChunkEvent, (event) => {
        const p = event.getParser();
        setItemId(p.chestId);

        setStoredFurniItems((prev) => {
            const next = p.fragmentNo === 0 ? [] : [...prev];
            next.push(...p.items);
            if (p.fragmentNo === p.totalFragments - 1) {
                const grouped = groupStoredFurni(next);
                setFurniEntries(grouped);
                setSelectedFurni((sel) =>
                    grouped.some((f) => f.baseItemId === sel) ? sel : grouped.length ? grouped[0].baseItemId : -1,
                );
            }
            return next;
        });
    });

    useMessageEvent<ChestFurniDeltaEvent>(ChestFurniDeltaEvent, (event) => {
        const p = event.getParser();

        setStoredFurniItems((prev) => {
            const removed = new Set(p.removedIds);
            const next = [...prev.filter((i) => !removed.has(i.inventoryId)), ...p.added];
            const grouped = groupStoredFurni(next);
            setFurniEntries(grouped);
            setSelectedFurni((sel) =>
                grouped.some((f) => f.baseItemId === sel) ? sel : grouped.length ? grouped[0].baseItemId : -1,
            );
            return next;
        });
    });

    useMessageEvent<ChestLogEvent>(ChestLogEvent, (event) => {
        const p = event.getParser();
        setLogRows(p.rows.map((r) => ({ ...r })));
        setShowLog(true);
    });

    if (itemId === -1) return null;

    const creditsBalance = entries.find((e) => e.currencyType === CREDITS)?.amount ?? 0;
    // Scene image follows the official CoinChestSubController.CHEST_STATES thresholds:
    // absolute coin count (NOT a fill ratio) — 0 -> zero, >=1 -> low, >=20 -> medium, >=100 -> high.
    const sceneImg =
        creditsBalance >= 100 ? sceneHigh : creditsBalance >= 20 ? sceneMedium : creditsBalance >= 1 ? sceneLow : sceneZero;

    const isFurni = chestKind === CHEST_KIND_FURNI;
    const chestTypeLabel = isFurni
        ? LocalizeText('wiredchests.furni_chest')
        : LocalizeText('wiredchests.coin_chest');
    const selectedFurniQty = furniEntries.find((f) => f.baseItemId === selectedFurni)?.quantity ?? 0;

    const close = () => setItemId(-1);
    const deposit = () => {
        if (depositAmount <= 0) return;
        SendMessageComposer(new ChestDepositComposer(itemId, CREDITS, depositAmount));
        setDepositAmount(0);
    };
    const withdraw = () => {
        if (withdrawAmount <= 0) return;
        SendMessageComposer(new ChestWithdrawComposer(itemId, CREDITS, withdrawAmount));
        setWithdrawAmount(0);
    };
    const withdrawAll = () => setConfirmWithdrawAll(true);
    const doWithdrawAll = () => {
        if (isFurni) {
            SendMessageComposer(new ChestWithdrawAllFurniComposer(itemId));
        } else {
            SendMessageComposer(new ChestWithdrawComposer(itemId, CREDITS, -1));
        }
        setConfirmWithdrawAll(false);
    };
    const withdrawFurni = () => {
        if (selectedFurni < 0 || furniWithdrawAmount <= 0 || selectedFurniQty <= 0) return;
        SendMessageComposer(new ChestWithdrawFurniComposer(itemId, false, selectedFurni, '', furniWithdrawAmount));
    };
    const depositInventoryItem = (inventoryItemId: number) => {
        if (inventoryItemId <= 0 || used >= capacityMax) return;
        SendMessageComposer(new ChestDepositInventoryItemComposer(itemId, inventoryItemId));
    };
    const startDepositFurni = () => setDepositFurniOpen((v) => !v);
    const requestLog = () => SendMessageComposer(new ChestRequestLogComposer(itemId));
    const saveSettings = () => {
        SendMessageComposer(new ChestSaveSettingsComposer(itemId, name, description, accessOpen, accessDonate, appearanceState));
        setShowSettings(false);
    };
    const saveNotifications = () => {
        SendMessageComposer(new ChestSaveNotificationsComposer(itemId, notifyFull, notifyDonation, notifyWithdraw, notifyEmpty, notifyWired, notifyMode));
        setShowNotifications(false);
    };
    const buyUpgrade = () => {
        SendMessageComposer(new ChestUpgradeCapacityComposer(itemId, upgradeQty));
        setShowUpgrade(false);
    };

    return (
        <>
            {/* ===== MAIN WINDOW ===== */}
            <NitroCardView className="nitro-widget-chest" theme="primary-slim" style={{ width: 460 }}>
                <NitroCardHeaderView headerText={name || chestTypeLabel} onCloseClick={close} />
                <NitroCardContentView>
                    {/* ===== header box (chest_generic.xml container "header", 460x51) =====
                         grey band (layout_1 #dadada) + bottom splitter (#c0c0c0 @y50);
                         desc text @(10,10) 380w bold blend=0.6; bell btn @(397,7) + gear btn @(426,7) 24x24.
                         margin -10 bleeds past NitroCardContentView's p-[10px] to the card edges. */}
                    <div
                        style={{
                            position: 'relative',
                            background: '#dadada',
                            borderBottom: '1px solid #c0c0c0',
                            margin: '-10px -10px 0',
                            padding: '10px',
                            minHeight: 51,
                            boxSizing: 'border-box',
                        }}
                    >
                        <Text
                            style={{
                                display: 'block',
                                maxWidth: 380,
                                paddingRight: 58,
                                fontWeight: 'bold',
                                fontSize: 12,
                                lineHeight: 1.25,
                                color: '#2e2e2e',
                                opacity: 0.6,
                            }}
                        >
                            {description || LocalizeText('wiredchests.description_placeholder')}
                        </Text>
                        <div style={{ position: 'absolute', top: 7, right: 9, display: 'flex', gap: 5 }}>
                            {/* notification_settings_button 24x24, icon wired_chests_bell_icon 12x15 */}
                            <button
                                type="button"
                                className="flex items-center justify-center cursor-pointer shrink-0"
                                style={{ width: 24, height: 24, background: '#f1f0ee', border: '1px solid #cfcabc', borderRadius: 4, padding: 0 }}
                                onClick={() => setShowNotifications(true)}
                                title={LocalizeText('wiredchests.notifications.button')}
                            >
                                <img src={bellIcon} width={12} height={15} alt="" draggable={false} style={{ imageRendering: 'pixelated' }} />
                            </button>
                            {/* settings_button 24x24, icon wired_chests_gear_icon 14x14 */}
                            <button
                                type="button"
                                className="flex items-center justify-center cursor-pointer shrink-0"
                                style={{ width: 24, height: 24, background: '#f1f0ee', border: '1px solid #cfcabc', borderRadius: 4, padding: 0 }}
                                onClick={() => setShowSettings(true)}
                                title={LocalizeText('wiredchests.settings.button')}
                            >
                                <img src={gearIcon} width={14} height={14} alt="" draggable={false} style={{ imageRendering: 'pixelated' }} />
                            </button>
                        </div>
                    </div>
                    {/* ===== FURNI CHEST body (furni_chest_contents.xml): item grid (left) + detail panel (right) ===== */}
                    {isFurni && (
                        <Flex gap={1} style={{ margin: '4px 0' }}>
                            <Column gap={1} style={{ width: 255 }}>
                            {furniEntries.length >= FURNI_SEARCH_THRESHOLD && (
                                <Flex alignItems="center" gap={1}>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder={LocalizeText('catalog.search.title')}
                                        value={furniSearch}
                                        onChange={(e) => setFurniSearch(e.target.value)}
                                    />
                                    {furniSearch.length > 0 && (
                                        <ChestButton fixed onClick={() => setFurniSearch('')}>
                                            ×
                                        </ChestButton>
                                    )}
                                </Flex>
                            )}
                            <div style={{ width: 255, height: 242, border: '1px solid #e3e3e3', borderRadius: 3, background: '#fff', overflowY: 'auto', padding: 5 }}>
                                {visibleFurniEntries.length === 0 ? (
                                    <Flex alignItems="center" justifyContent="center" style={{ height: '100%' }}>
                                        <Text small style={{ opacity: 0.5 }}>
                                            {LocalizeText('wiredchests.empty_furni')}
                                        </Text>
                                    </Flex>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {visibleFurniEntries.map((f) => (
                                            <div
                                                key={f.baseItemId}
                                                onClick={() => setSelectedFurni(f.baseItemId)}
                                                title={furniName(f.baseItemId)}
                                                style={{
                                                    position: 'relative',
                                                    width: 40,
                                                    height: 40,
                                                    border: `1px solid ${selectedFurni === f.baseItemId ? '#5b9bd5' : '#cbcbcb'}`,
                                                    borderRadius: 3,
                                                    background: '#fafafa',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {/* small furni ICON (like inventory/catalog) — fits the 40px cell;
                                                    the full LayoutFurniImageView render overflowed/cropped here */}
                                                <img
                                                    src={ProductImageUtility.getProductImageUrl(FurnitureType.FLOOR, f.baseItemId, '')}
                                                    alt=""
                                                    draggable={false}
                                                    style={{ maxWidth: 38, maxHeight: 38, objectFit: 'contain', imageRendering: 'pixelated' }}
                                                />
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        right: 1,
                                                        top: 1,
                                                        minWidth: 13,
                                                        height: 14,
                                                        padding: '0 2px',
                                                        background: '#2f6982',
                                                        color: '#fff',
                                                        fontSize: 10,
                                                        lineHeight: '14px',
                                                        textAlign: 'center',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {f.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </Column>
                            {/* right_panel: furni name + preview + withdraw */}
                            <div style={{ width: 175, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, minHeight: 211, border: '1px solid #d8d8d8', borderRadius: 3, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 6, overflow: 'hidden' }}>
                                    {selectedFurni >= 0 ? (
                                        <>
                                            <Text bold style={{ textAlign: 'center', marginBottom: 4 }}>
                                                {furniName(selectedFurni)}
                                            </Text>
                                            <Flex alignItems="center" justifyContent="center" style={{ flex: 1 }}>
                                                <LayoutFurniImageView productType="s" productClassId={selectedFurni} direction={2} />
                                            </Flex>
                                        </>
                                    ) : (
                                        <img
                                            src={furniEmptyScene}
                                            alt=""
                                            draggable={false}
                                            style={{ maxWidth: '100%', margin: 'auto', imageRendering: 'pixelated' }}
                                        />
                                    )}
                                </div>
                                {/* withdraw_cont: input (30) + Preleva (73) */}
                                <Flex alignItems="center" justifyContent="end" gap={1} className="mt-1">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="nitro-chest__input nitro-chest__input--furni"
                                        value={furniWithdrawAmount}
                                        onChange={(e) =>
                                            setFurniWithdrawAmount(Math.max(0, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))
                                        }
                                    />
                                    <ChestButton fixed disabled={selectedFurni < 0 || selectedFurniQty <= 0} onClick={withdrawFurni}>
                                        {LocalizeText('wiredchests.withdraw')}
                                    </ChestButton>
                                </Flex>
                            </div>
                        </Flex>
                    )}
                    {/* ===== REAL Habbo chest scene (coin chest, extracted asset) + dynamic overlays.
                         Overlay coords are taken verbatim from the official Sulake layout
                         `coins_chest_contents.xml` (moving_container = the 324x228 scene). ===== */}
                    {!isFurni && (
                        <>
                    <div style={{ position: 'relative', width: 324, height: 228, margin: '4px auto' }}>
                        <img
                            src={sceneImg}
                            width={324}
                            height={228}
                            alt=""
                            draggable={false}
                            style={{ imageRendering: 'pixelated', display: 'block' }}
                        />
                        {/* balance_cont @ (9,68): "Saldo" label = balance_txt @ (2,7), font 11, auto_size left */}
                        <div style={{ position: 'absolute', left: 11, top: 75, width: 45, color: '#5b4632', fontWeight: 'bold', fontSize: 11, lineHeight: 1, textAlign: 'left' }}>
                            {LocalizeText('wiredchests.balance')}
                        </div>
                        {/* balance_container: AS3 centers it horizontally inside balance_cont (x9..63) at runtime
                            (balanceContainerList.x = parent.width/2 - width/2). amount (bold) + coin_icon (13x15) */}
                        <div style={{ position: 'absolute', left: 9, top: 90, width: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#5b4632' }}>{creditsBalance}</span>
                            {/* coin_icon (coins_chest_contents.xml <icon style=35>) = real credits currency icon */}
                            <LayoutCurrencyIcon type={CREDITS} style={{ width: 15, height: 15 }} />
                        </div>
                        {/* withdraw_cont @ (160,18): input (27x19 @ +0,+1) + spacing 5 + withdraw_btn (73x22 @ +32,0) */}
                        <div style={{ position: 'absolute', left: 160, top: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="nitro-chest__input nitro-chest__input--coin"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(Math.max(0, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))}
                            />
                            <ChestButton fixed disabled={creditsBalance <= 0} onClick={withdraw}>
                                {LocalizeText('wiredchests.withdraw')}
                            </ChestButton>
                        </div>
                    </div>
                    {depositOpen && (
                        <Flex alignItems="center" gap={1} className="mt-1">
                            <input
                                type="number"
                                min={0}
                                className="form-control form-control-sm"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            />
                            <ChestButton wide onClick={deposit}>
                                {LocalizeText('wiredchests.deposit')}
                            </ChestButton>
                        </Flex>
                    )}
                        </>
                    )}
                    <div className="nitro-wired__divider" />
                    <Flex alignItems="center" justifyContent="between">
                        <Text small>
                            {LocalizeText('wiredchests.space_used2', ['count', 'total'], [String(used), String(capacityMax)])}
                        </Text>
                        <ChestButton
                            icon
                            onClick={() => setShowUpgrade(true)}
                            title={LocalizeText('wiredchests.upgrade_capacity')}
                        >
                            +
                        </ChestButton>
                    </Flex>
                    {/* button_row (chest_generic.xml): left group = Preleva tutto + Deposito iniziale, right = Visualizza log */}
                    <div className="nitro-chest__footer-row">
                        {!isFurni ? (
                            <div className="nitro-chest__footer-group">
                                <ChestButton wide disabled={creditsBalance <= 0} onClick={withdrawAll}>
                                    {LocalizeText('wiredchests.withdraw_all')}
                                </ChestButton>
                                <ChestButton wide onClick={() => setDepositOpen((v) => !v)}>
                                    {LocalizeText('wiredchests.initial_deposit')}
                                </ChestButton>
                            </div>
                        ) : (
                            <div className="nitro-chest__footer-group">
                                <ChestButton wide disabled={furniEntries.length <= 0} onClick={withdrawAll}>
                                    {LocalizeText('wiredchests.withdraw_all')}
                                </ChestButton>
                                <ChestButton wide onClick={startDepositFurni}>
                                    {LocalizeText(depositFurniOpen ? 'wiredchests.cancel' : 'wiredchests.start_deposit')}
                                </ChestButton>
                            </div>
                        )}
                        <ChestButton wide onClick={requestLog}>
                            {LocalizeText('wiredchests.view_logs')}
                        </ChestButton>
                    </div>
                    {isFurni && depositFurniOpen && (
                        <Column gap={1} className="mt-1 p-2 border rounded">
                            <Text bold small>
                                {LocalizeText('wiredchests.deposit_furni.title')}
                            </Text>
                            {depositableInventoryItems.length === 0 ? (
                                <Text small style={{ opacity: 0.6 }}>
                                    {LocalizeText('wiredchests.deposit_furni.empty_inventory')}
                                </Text>
                            ) : (
                                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {depositableInventoryItems.map((row) => (
                                        <div
                                            key={row.id}
                                            title={row.name}
                                            onClick={() => depositInventoryItem(row.id)}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                border: '1px solid #cbcbcb',
                                                borderRadius: 3,
                                                background: '#fafafa',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: used >= capacityMax ? 'not-allowed' : 'pointer',
                                                opacity: used >= capacityMax ? 0.45 : 1,
                                            }}
                                        >
                                            <img
                                                src={ProductImageUtility.getProductImageUrl(FurnitureType.FLOOR, row.baseItemId, '')}
                                                alt=""
                                                draggable={false}
                                                style={{ maxWidth: 38, maxHeight: 38, objectFit: 'contain', imageRendering: 'pixelated' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {capacityMax - used <= 0 && (
                                <Text small style={{ color: '#a33' }}>
                                    {LocalizeText('wiredchests.deposit_furni.full')}
                                </Text>
                            )}
                        </Column>
                    )}
                </NitroCardContentView>
            </NitroCardView>

            {/* ===== SETTINGS ===== */}
            {showSettings && (
                <NitroCardView className="nitro-widget-chest-settings" theme="primary-slim" style={{ width: 360 }}>
                    <NitroCardHeaderView
                        headerText={LocalizeText('wiredchests.settings.title', ['chest_type'], [chestTypeLabel])}
                        onCloseClick={() => setShowSettings(false)}
                    />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text bold>{LocalizeText('wiredchests.settings.access')}</Text>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={accessOpen} onChange={(e) => setAccessOpen(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.settings.access.open')}</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={accessDonate} onChange={(e) => setAccessDonate(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.settings.access.donate')}</Text>
                            </label>
                            <Text bold>{LocalizeText('wiredchests.settings.info')}</Text>
                            <Text small>{LocalizeText('wiredchests.settings.info.name')}</Text>
                            <input className="form-control form-control-sm" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
                            <Text small>{LocalizeText('wiredchests.settings.info.desc')}</Text>
                            <textarea className="form-control form-control-sm" rows={3} maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
                            <Text bold>{LocalizeText('wiredchests.settings.appearance')}</Text>
                            <Text small>{LocalizeText('wiredchests.settings.appearance.state')}</Text>
                            <select className="form-select form-select-sm" value={appearanceState} onChange={(e) => setAppearanceState(parseInt(e.target.value, 10))}>
                                {appearanceOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <div className="nitro-chest__actions">
                                <ChestButton wide onClick={saveSettings}>
                                    {LocalizeText('wiredchests.ready')}
                                </ChestButton>
                                <ChestButton wide onClick={() => setShowSettings(false)}>
                                    {LocalizeText('wiredchests.cancel')}
                                </ChestButton>
                            </div>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== NOTIFICATIONS ===== */}
            {showNotifications && (
                <NitroCardView className="nitro-widget-chest-notifications" theme="primary-slim" style={{ width: 360 }}>
                    <NitroCardHeaderView
                        headerText={LocalizeText('wiredchests.notification_settings.title', ['chest_type'], [chestTypeLabel])}
                        onCloseClick={() => setShowNotifications(false)}
                    />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text bold>{LocalizeText('wiredchests.notification_settings.enable_notifications.generic')}</Text>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyFull} onChange={(e) => setNotifyFull(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.notification_settings.enable_notifications.generic.0')}</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyDonation} onChange={(e) => setNotifyDonation(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.notification_settings.enable_notifications.generic.1')}</Text>
                            </label>
                            <Text bold>{LocalizeText('wiredchests.notification_settings.enable_notifications.wired')}</Text>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyWithdraw} onChange={(e) => setNotifyWithdraw(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.notification_settings.enable_notifications.wired.0')}</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyEmpty} onChange={(e) => setNotifyEmpty(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.notification_settings.enable_notifications.wired.1')}</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyWired} onChange={(e) => setNotifyWired(e.target.checked)} />
                                <Text small>{LocalizeText('wiredchests.notification_settings.enable_notifications.wired.2')}</Text>
                            </label>
                            <Text bold>{LocalizeText('wiredchests.notification_settings.notification_mode.when')}</Text>
                            <select className="form-select form-select-sm" value={notifyMode} onChange={(e) => setNotifyMode(parseInt(e.target.value, 10))}>
                                {notifyModes.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <div className="nitro-chest__actions">
                                <ChestButton wide onClick={saveNotifications}>
                                    {LocalizeText('wiredchests.ready')}
                                </ChestButton>
                                <ChestButton wide onClick={() => setShowNotifications(false)}>
                                    {LocalizeText('wiredchests.cancel')}
                                </ChestButton>
                            </div>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== UPGRADE ===== */}
            {showUpgrade && (
                <NitroCardView className="nitro-widget-chest-upgrade" theme="primary-slim" style={{ width: 340 }}>
                    <NitroCardHeaderView headerText={LocalizeText('wiredchests.upgrade.title')} onCloseClick={() => setShowUpgrade(false)} />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text bold>
                                {LocalizeText('wiredchests.upgrade.capacity.extra', ['purchase_capacity'], [String(UPGRADE_STEP * upgradeQty)])}
                            </Text>
                            <Text small>
                                {LocalizeText('wiredchests.upgrade.capacity.current', ['current_capacity'], [String(capacityMax)])}
                            </Text>
                            <Text small>
                                {LocalizeText('wiredchests.upgrade.capacity.new', ['new_capacity'], [String(capacityMax + UPGRADE_STEP * upgradeQty)])}
                            </Text>
                            <Flex alignItems="center" gap={2}>
                                <Text small>{LocalizeText('wiredchests.quantity')}</Text>
                                <select className="form-select form-select-sm" value={upgradeQty} onChange={(e) => setUpgradeQty(parseInt(e.target.value, 10))}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((q) => (
                                        <option key={q} value={q}>
                                            {q}
                                        </option>
                                    ))}
                                </select>
                            </Flex>
                            <Text bold>
                                {LocalizeText('wiredchests.upgrade.price', ['credits', 'diamonds'], [String(COST_CREDITS * upgradeQty), String(COST_DIAMONDS * upgradeQty)])}
                            </Text>
                            <div className="nitro-chest__actions">
                                <ChestButton wide onClick={buyUpgrade}>
                                    {LocalizeText('wiredchests.upgrade.buy')}
                                </ChestButton>
                                <ChestButton wide onClick={() => setShowUpgrade(false)}>
                                    {LocalizeText('wiredchests.cancel')}
                                </ChestButton>
                            </div>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== LOG ===== */}
            {showLog && (
                <NitroCardView className="nitro-widget-chest-log" theme="primary-slim" style={{ width: 520 }}>
                    <NitroCardHeaderView headerText={LocalizeText('wiredchests.logs.title')} onCloseClick={() => setShowLog(false)} />
                    <NitroCardContentView>
                        <Column gap={1}>
                            <Text small>{LocalizeText('wiredchests.logs.chest_id', ['id'], [String(itemId)])}</Text>
                            <Flex gap={2} className="border-b pb-1">
                                <Text bold className="w-20">
                                    {LocalizeText('wiredchests.logs.col.type')}
                                </Text>
                                <Text bold className="w-24">
                                    {LocalizeText('wiredchests.logs.col.timestamp')}
                                </Text>
                                <Text bold className="grow!">
                                    {LocalizeText('wiredchests.logs.col.username')}
                                </Text>
                                <Text bold className="w-16">
                                    {LocalizeText('wiredchests.logs.col.withdraws')}
                                </Text>
                                <Text bold className="w-16">
                                    {LocalizeText('wiredchests.logs.col.deposits')}
                                </Text>
                            </Flex>
                            {logRows.length === 0 && <Text small>{LocalizeText('wiredchests.logs.empty')}</Text>}
                            {logRows.map((r, i) => (
                                <Flex key={i} gap={2}>
                                    <Text small className="w-20">
                                        {r.type === 'withdraw'
                                            ? LocalizeText('wiredchests.logs.type.withdraw')
                                            : LocalizeText('wiredchests.logs.type.deposit')}
                                    </Text>
                                    <Text small className="w-24">
                                        {new Date(r.timestamp * 1000).toLocaleString()}
                                    </Text>
                                    <Text small className="grow!">
                                        {r.userName}
                                    </Text>
                                    <Text small className="w-16">
                                        {r.withdrawn || ''}
                                    </Text>
                                    <Text small className="w-16">
                                        {r.deposited || ''}
                                    </Text>
                                </Flex>
                            ))}
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== WITHDRAW-ALL CONFIRM (mirrors WiredChestWrapperView.onWithdrawAllClick) ===== */}
            {confirmWithdrawAll && (
                <NitroCardView className="nitro-widget-chest-confirm" theme="primary-slim" style={{ width: 320 }}>
                    <NitroCardHeaderView headerText={LocalizeText('wiredchests.withdraw_all.confirm.title')} onCloseClick={() => setConfirmWithdrawAll(false)} />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text>
                                {LocalizeText(
                                    isFurni ? 'wiredchests.withdraw_all.confirm.desc_furni' : 'wiredchests.withdraw_all.confirm.desc',
                                )}
                            </Text>
                            <div className="nitro-chest__actions">
                                <ChestButton wide onClick={doWithdrawAll}>
                                    {LocalizeText('wiredchests.withdraw_all.confirm.yes')}
                                </ChestButton>
                                <ChestButton wide onClick={() => setConfirmWithdrawAll(false)}>
                                    {LocalizeText('wiredchests.cancel')}
                                </ChestButton>
                            </div>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}
        </>
    );
};
