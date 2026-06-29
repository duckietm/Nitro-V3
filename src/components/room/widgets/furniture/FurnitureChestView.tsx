import {
    ChestDataEvent,
    ChestDepositComposer,
    ChestLogEvent,
    ChestRequestLogComposer,
    ChestSaveNotificationsComposer,
    ChestSaveSettingsComposer,
    ChestUpgradeCapacityComposer,
    ChestWithdrawComposer,
    ChestWithdrawFurniComposer,
    FurnitureType,
    GetSessionDataManager,
} from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { ProductImageUtility, SendMessageComposer } from '../../../../api';
import { Button, Column, Flex, LayoutCurrencyIcon, LayoutFurniImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
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

const furniName = (baseItemId: number): string => {
    const data = GetSessionDataManager().getFloorItemData(baseItemId);
    return data?.name || `#${baseItemId}`;
};
const COST_CREDITS = 10;
const COST_DIAMONDS = 10;

const APPEARANCE_OPTIONS = [
    { value: 0, label: 'Apri quando qualcuno guarda dentro' },
    { value: 1, label: 'Sempre aperto' },
    { value: 2, label: 'Sempre chiuso' },
];

const NOTIFY_MODES = [
    { value: 0, label: 'Sempre' },
    { value: 1, label: 'Solo quando sono nella stanza' },
    { value: 2, label: 'Mai' },
];

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
        const furni = p.furniEntries.map((e) => ({ baseItemId: e.baseItemId, quantity: e.quantity }));
        setFurniEntries(furni);
        // keep selection valid; default to the first stored type
        setSelectedFurni((prev) =>
            furni.some((f) => f.baseItemId === prev) ? prev : furni.length ? furni[0].baseItemId : -1,
        );
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
        SendMessageComposer(new ChestWithdrawComposer(itemId, CREDITS, -1));
        setConfirmWithdrawAll(false);
    };
    const withdrawFurni = () => {
        if (selectedFurni < 0 || furniWithdrawAmount <= 0 || selectedFurniQty <= 0) return;
        SendMessageComposer(new ChestWithdrawFurniComposer(itemId, selectedFurni, furniWithdrawAmount));
    };
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
                <NitroCardHeaderView headerText={name || (isFurni ? 'Scrigno Furni' : 'Scrigno Crediti')} onCloseClick={close} />
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
                            {description || 'Per favore, deposita tutti i tuoi risparmi di una vita. Va bene. Fidati di me'}
                        </Text>
                        <div style={{ position: 'absolute', top: 7, right: 9, display: 'flex', gap: 5 }}>
                            {/* notification_settings_button 24x24, icon wired_chests_bell_icon 12x15 */}
                            <button
                                type="button"
                                className="flex items-center justify-center cursor-pointer shrink-0"
                                style={{ width: 24, height: 24, background: '#f1f0ee', border: '1px solid #cfcabc', borderRadius: 4, padding: 0 }}
                                onClick={() => setShowNotifications(true)}
                                title="Notifiche"
                            >
                                <img src={bellIcon} width={12} height={15} alt="" draggable={false} style={{ imageRendering: 'pixelated' }} />
                            </button>
                            {/* settings_button 24x24, icon wired_chests_gear_icon 14x14 */}
                            <button
                                type="button"
                                className="flex items-center justify-center cursor-pointer shrink-0"
                                style={{ width: 24, height: 24, background: '#f1f0ee', border: '1px solid #cfcabc', borderRadius: 4, padding: 0 }}
                                onClick={() => setShowSettings(true)}
                                title="Impostazioni"
                            >
                                <img src={gearIcon} width={14} height={14} alt="" draggable={false} style={{ imageRendering: 'pixelated' }} />
                            </button>
                        </div>
                    </div>
                    {/* ===== FURNI CHEST body (furni_chest_contents.xml): item grid (left) + detail panel (right) ===== */}
                    {isFurni && (
                        <Flex gap={1} style={{ margin: '4px 0' }}>
                            {/* items_grid_border: scrollable 42x42 cell grid */}
                            <div style={{ width: 255, height: 242, border: '1px solid #e3e3e3', borderRadius: 3, background: '#fff', overflowY: 'auto', padding: 5 }}>
                                {furniEntries.length === 0 ? (
                                    <Flex alignItems="center" justifyContent="center" style={{ height: '100%' }}>
                                        <Text small style={{ opacity: 0.5 }}>
                                            Nessun oggetto nello scrigno
                                        </Text>
                                    </Flex>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {furniEntries.map((f) => (
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
                                        value={furniWithdrawAmount}
                                        onChange={(e) =>
                                            setFurniWithdrawAmount(Math.max(0, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))
                                        }
                                        style={{ width: 36, height: 22, fontSize: 11, textAlign: 'center', border: '1px solid #b9b2a0', borderRadius: 2, padding: 0, boxSizing: 'border-box' }}
                                    />
                                    <Button variant="secondary" disabled={selectedFurni < 0 || selectedFurniQty <= 0} onClick={withdrawFurni}>
                                        Preleva
                                    </Button>
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
                            Saldo
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
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(Math.max(0, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))}
                                style={{ width: 27, height: 19, fontSize: 11, textAlign: 'center', border: '1px solid #d8c184', borderRadius: 2, padding: 0, background: '#fff', boxSizing: 'border-box' }}
                            />
                            <button
                                type="button"
                                onClick={withdraw}
                                disabled={creditsBalance <= 0}
                                style={{ height: 22, fontSize: 11, fontWeight: 'bold', padding: '0 10px', background: '#e9e6df', border: '1px solid #b9b2a0', borderRadius: 3, cursor: creditsBalance <= 0 ? 'default' : 'pointer', color: '#555', opacity: creditsBalance <= 0 ? 0.5 : 1 }}
                            >
                                Preleva
                            </button>
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
                            <Button variant="success" onClick={deposit}>
                                Deposita
                            </Button>
                        </Flex>
                    )}
                        </>
                    )}
                    <div className="nitro-wired__divider" />
                    <Flex alignItems="center" justifyContent="between">
                        <Text small>
                            Capacità utilizzata: {used}&nbsp;&nbsp;&nbsp;Massima capacità: {capacityMax}
                        </Text>
                        <Button variant="secondary" onClick={() => setShowUpgrade(true)} title="Aumenta capacità">
                            +
                        </Button>
                    </Flex>
                    {/* button_row (chest_generic.xml): left group = Preleva tutto + Deposito iniziale, right = Visualizza log */}
                    <Flex alignItems="center" justifyContent="between" className="mt-1">
                        {!isFurni ? (
                            <Flex gap={1}>
                                <Button variant="secondary" disabled={creditsBalance <= 0} onClick={withdrawAll}>
                                    Preleva tutto
                                </Button>
                                <Button variant="secondary" onClick={() => setDepositOpen((v) => !v)}>
                                    Deposito iniziale
                                </Button>
                            </Flex>
                        ) : (
                            <span />
                        )}
                        <Button variant="secondary" onClick={requestLog}>
                            Visualizza log
                        </Button>
                    </Flex>
                </NitroCardContentView>
            </NitroCardView>

            {/* ===== SETTINGS ===== */}
            {showSettings && (
                <NitroCardView className="nitro-widget-chest-settings" theme="primary-slim" style={{ width: 360 }}>
                    <NitroCardHeaderView headerText="Impostazioni Scrigno Crediti" onCloseClick={() => setShowSettings(false)} />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text bold>Impostazioni di accesso aggiuntive</Text>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={accessOpen} onChange={(e) => setAccessOpen(e.target.checked)} />
                                <Text small>Tutti possono aprire lo scrigno</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={accessDonate} onChange={(e) => setAccessDonate(e.target.checked)} />
                                <Text small>Tutti possono donare allo scrigno</Text>
                            </label>
                            <Text bold>Informazioni scrigno (facoltativo)</Text>
                            <Text small>Nome scrigno:</Text>
                            <input className="form-control form-control-sm" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
                            <Text small>Descrizione scrigno:</Text>
                            <textarea className="form-control form-control-sm" rows={3} maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
                            <Text bold>Impostazioni aspetto</Text>
                            <Text small>Stato scrigno:</Text>
                            <select className="form-select form-select-sm" value={appearanceState} onChange={(e) => setAppearanceState(parseInt(e.target.value, 10))}>
                                {APPEARANCE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <Flex gap={1}>
                                <Button variant="success" onClick={saveSettings}>
                                    Pronto
                                </Button>
                                <Button variant="secondary" onClick={() => setShowSettings(false)}>
                                    Annulla
                                </Button>
                            </Flex>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== NOTIFICATIONS ===== */}
            {showNotifications && (
                <NitroCardView className="nitro-widget-chest-notifications" theme="primary-slim" style={{ width: 360 }}>
                    <NitroCardHeaderView headerText="Impostazione notifiche Scrigno Crediti" onCloseClick={() => setShowNotifications(false)} />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text bold>Notifiche generali</Text>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyFull} onChange={(e) => setNotifyFull(e.target.checked)} />
                                <Text small>Avvisami quando lo scrigno è pieno</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyDonation} onChange={(e) => setNotifyDonation(e.target.checked)} />
                                <Text small>Avvisami quando qualcuno fa una donazione</Text>
                            </label>
                            <Text bold>Solo per gli scrigni Wired</Text>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyWithdraw} onChange={(e) => setNotifyWithdraw(e.target.checked)} />
                                <Text small>Avvisami quando qualcuno preleva dallo scrigno</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyEmpty} onChange={(e) => setNotifyEmpty(e.target.checked)} />
                                <Text small>Avvisami quando lo scrigno è vuoto</Text>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="form-check-input" checked={notifyWired} onChange={(e) => setNotifyWired(e.target.checked)} />
                                <Text small>Avvisami per qualsiasi transazione Wired</Text>
                            </label>
                            <Text bold>Avvisami quando:</Text>
                            <select className="form-select form-select-sm" value={notifyMode} onChange={(e) => setNotifyMode(parseInt(e.target.value, 10))}>
                                {NOTIFY_MODES.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <Flex gap={1}>
                                <Button variant="success" onClick={saveNotifications}>
                                    Pronto
                                </Button>
                                <Button variant="secondary" onClick={() => setShowNotifications(false)}>
                                    Annulla
                                </Button>
                            </Flex>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== UPGRADE ===== */}
            {showUpgrade && (
                <NitroCardView className="nitro-widget-chest-upgrade" theme="primary-slim" style={{ width: 340 }}>
                    <NitroCardHeaderView headerText="Aggiornamento Scrigno" onCloseClick={() => setShowUpgrade(false)} />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text bold>Capacità scrigno extra: +{UPGRADE_STEP * upgradeQty}</Text>
                            <Text small>Capacità massima attuale: {capacityMax}</Text>
                            <Text small>Nuova capacità massima: {capacityMax + UPGRADE_STEP * upgradeQty}</Text>
                            <Flex alignItems="center" gap={2}>
                                <Text small>Quantità:</Text>
                                <select className="form-select form-select-sm" value={upgradeQty} onChange={(e) => setUpgradeQty(parseInt(e.target.value, 10))}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((q) => (
                                        <option key={q} value={q}>
                                            {q}
                                        </option>
                                    ))}
                                </select>
                            </Flex>
                            <Text bold>
                                Prezzo: {COST_CREDITS * upgradeQty} crediti + {COST_DIAMONDS * upgradeQty} diamanti
                            </Text>
                            <Flex gap={1}>
                                <Button variant="success" onClick={buyUpgrade}>
                                    Acquista
                                </Button>
                                <Button variant="secondary" onClick={() => setShowUpgrade(false)}>
                                    Annulla
                                </Button>
                            </Flex>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}

            {/* ===== LOG ===== */}
            {showLog && (
                <NitroCardView className="nitro-widget-chest-log" theme="primary-slim" style={{ width: 520 }}>
                    <NitroCardHeaderView headerText="Log delle transazioni" onCloseClick={() => setShowLog(false)} />
                    <NitroCardContentView>
                        <Column gap={1}>
                            <Text small>Id scrigno {itemId}</Text>
                            <Flex gap={2} className="border-b pb-1">
                                <Text bold className="w-20">
                                    Tipo
                                </Text>
                                <Text bold className="w-24">
                                    Timestamp
                                </Text>
                                <Text bold className="grow!">
                                    Nome utente
                                </Text>
                                <Text bold className="w-16">
                                    Prelievi
                                </Text>
                                <Text bold className="w-16">
                                    Depositi
                                </Text>
                            </Flex>
                            {logRows.length === 0 && <Text small>Nessuna transazione trovata.</Text>}
                            {logRows.map((r, i) => (
                                <Flex key={i} gap={2}>
                                    <Text small className="w-20">
                                        {r.type === 'withdraw' ? 'Prelievo' : 'Deposito'}
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
                    <NitroCardHeaderView headerText="Preleva tutto" onCloseClick={() => setConfirmWithdrawAll(false)} />
                    <NitroCardContentView>
                        <Column gap={2}>
                            <Text>Vuoi davvero prelevare tutti i crediti dallo scrigno?</Text>
                            <Flex gap={1}>
                                <Button variant="success" onClick={doWithdrawAll}>
                                    Sì, preleva tutto
                                </Button>
                                <Button variant="secondary" onClick={() => setConfirmWithdrawAll(false)}>
                                    Annulla
                                </Button>
                            </Flex>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView>
            )}
        </>
    );
};
