import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText } from '../../../../../api';
import { LayoutBadgeImageView } from '../../../../../common';
import { useInventoryBadges } from '../../../../../hooks';

interface InfoStandBadgeSlotProps
{
    slotIndex: number;
    badgeCode?: string;
    isOwnUser: boolean;
}

const BadgeMiniPicker: FC<{
    onSelect: (badgeCode: string) => void;
    onClose: () => void;
    activeBadgeCodes: (string | null)[];
}> = ({ onSelect, onClose, activeBadgeCodes }) =>
{
    const { badgeCodes = [], requestBadges = null } = useInventoryBadges();
    const ref = useRef<HTMLDivElement>(null);
    const [ search, setSearch ] = useState('');

    useEffect(() =>
    {
        if(badgeCodes.length === 0) requestBadges();
    }, []);

    const activeSet = new Set(activeBadgeCodes.filter(Boolean));
    const availableBadges = badgeCodes.filter(code => !activeSet.has(code));
    const filtered = search.length > 0
        ? availableBadges.filter(code => code.toLowerCase().includes(search.toLowerCase()))
        : availableBadges;

    useEffect(() =>
    {
        const handleClickOutside = (event: MouseEvent) =>
        {
            if(ref.current && !ref.current.contains(event.target as Node)) onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ onClose ]);

    return (
        <div
            ref={ ref }
            className="absolute right-[calc(100%+8px)] top-0 z-50 bg-[rgba(28,28,32,0.97)] border border-white/20 rounded-md p-2 shadow-lg min-w-[160px]"
            onClick={ e => e.stopPropagation() }>
            <input
                autoFocus
                className="w-full text-xs text-white bg-white/10 border border-white/20 rounded px-2 py-1 mb-2 outline-none focus:border-white/40"
                placeholder={ LocalizeText('catalog.search') }
                type="text"
                value={ search }
                onChange={ e => setSearch(e.target.value) }
            />
            { badgeCodes.length === 0
                ? <span className="text-xs text-white/40 text-center py-2 block">{ LocalizeText('generic.loading') }</span>
                : (
                    <div className="grid grid-cols-4 gap-1 max-h-[160px] overflow-y-auto">
                        { filtered.slice(0, 40).map(code => (
                            <div
                                key={ code }
                                className="flex items-center justify-center w-[36px] h-[36px] cursor-pointer rounded border border-transparent hover:border-white/40 hover:bg-white/10 transition-all"
                                onClick={ () => onSelect(code) }>
                                <LayoutBadgeImageView badgeCode={ code } />
                            </div>
                        )) }
                        { filtered.length === 0 && (
                            <span className="text-xs text-white/40 col-span-4 text-center py-2">{ LocalizeText('generic.no_results_found') }</span>
                        ) }
                    </div>
                ) }
        </div>
    );
};

export const InfoStandBadgeSlotView: FC<InfoStandBadgeSlotProps> = ({ slotIndex, badgeCode: badgeCodeFromProps, isOwnUser }) =>
{
    const { activeBadgeCodes = [], setBadgeAtSlot = null, swapBadges = null, removeBadge = null, requestBadges = null } = useInventoryBadges();
    const [ isDragOver, setIsDragOver ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ justDropped, setJustDropped ] = useState(false);
    const [ showPicker, setShowPicker ] = useState(false);

    const hookInitialized = activeBadgeCodes.length > 0;

    // Load badge data for own user so hook is initialized before any DnD
    useEffect(() =>
    {
        if(isOwnUser && !hookInitialized) requestBadges();
    }, [ isOwnUser, hookInitialized, requestBadges ]);
    const hookBadge = hookInitialized ? (activeBadgeCodes[slotIndex] ?? null) : null;
    // Once hook has data, use ONLY hook data for own user (no stale props fallback)
    const badgeCode = isOwnUser
        ? (hookInitialized ? hookBadge : (badgeCodeFromProps ?? null))
        : (badgeCodeFromProps ?? null);

    const onDragStart = useCallback((event: React.DragEvent) =>
    {
        if(!badgeCode || !isOwnUser) return;
        event.dataTransfer.setData('badgeCode', badgeCode);
        event.dataTransfer.setData('infostandSlot', slotIndex.toString());
        event.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);

        const badgeUrl = GetConfigurationValue<string>('badge.asset.url').replace('%badgename%', badgeCode);
        const img = new Image();
        img.src = badgeUrl;
        event.dataTransfer.setDragImage(img, 20, 20);
    }, [ badgeCode, slotIndex, isOwnUser ]);

    const onDragEnd = useCallback(() => setIsDragging(false), []);

    const onDragOver = useCallback((event: React.DragEvent) =>
    {
        if(!isOwnUser) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    }, [ isOwnUser ]);

    const onDragLeave = useCallback(() => setIsDragOver(false), []);

    const onDrop = useCallback((event: React.DragEvent) =>
    {
        event.preventDefault();
        setIsDragOver(false);
        if(!isOwnUser) return;

        const droppedBadgeCode = event.dataTransfer.getData('badgeCode');
        const sourceSlotStr = event.dataTransfer.getData('infostandSlot');

        if(!droppedBadgeCode) return;

        if(sourceSlotStr !== '')
        {
            const sourceSlot = parseInt(sourceSlotStr);

            if(sourceSlot !== slotIndex) swapBadges(sourceSlot, slotIndex);
        }
        else
        {
            setBadgeAtSlot(droppedBadgeCode, slotIndex);
        }

        setJustDropped(true);
        setTimeout(() => setJustDropped(false), 300);
    }, [ isOwnUser, slotIndex, swapBadges, setBadgeAtSlot ]);

    const handleSlotClick = useCallback(() =>
    {
        if(!isOwnUser || badgeCode) return;

        setShowPicker(true);
    }, [ isOwnUser, badgeCode ]);

    const handleDoubleClick = useCallback(() =>
    {
        if(!isOwnUser || !badgeCode) return;

        removeBadge(badgeCode);
    }, [ isOwnUser, badgeCode, removeBadge ]);

    const handlePickerSelect = useCallback((code: string) =>
    {
        setBadgeAtSlot(code, slotIndex);
        setShowPicker(false);
    }, [ setBadgeAtSlot, slotIndex ]);

    return (
        <div className="relative">
            <div
                className={ `flex items-center justify-center relative w-[40px] h-[40px] bg-no-repeat bg-center transition-all duration-150
                    ${ isOwnUser && badgeCode ? 'cursor-grab active:cursor-grabbing' : '' }
                    ${ isOwnUser && !badgeCode ? 'cursor-pointer' : '' }
                    ${ isDragging ? 'opacity-30 scale-90' : '' }
                    ${ isOwnUser && !isDragging ? 'hover:scale-110 hover:brightness-125 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]' : '' }
                    ${ isDragOver ? 'scale-110 ring-2 ring-blue-400/60 rounded-sm bg-blue-400/15 animate-pulse-glow' : '' }
                    ${ justDropped ? 'animate-drop-settle' : '' }
                    ${ isOwnUser && !badgeCode ? 'opacity-40 hover:opacity-70 border border-dashed border-white/20 rounded-sm' : '' }` }
                draggable={ isOwnUser && !!badgeCode }
                onDragEnd={ onDragEnd }
                onDragLeave={ onDragLeave }
                onDragOver={ onDragOver }
                onDragStart={ onDragStart }
                onDrop={ onDrop }
                onClick={ handleSlotClick }
                onDoubleClick={ handleDoubleClick }>
                { badgeCode
                    ? <LayoutBadgeImageView badgeCode={ badgeCode } showInfo={ true } />
                    : isOwnUser && <FaPlus className="text-white/30 text-[10px]" /> }
            </div>
            { showPicker && (
                <BadgeMiniPicker
                    activeBadgeCodes={ activeBadgeCodes }
                    onClose={ () => setShowPicker(false) }
                    onSelect={ handlePickerSelect }
                />
            ) }
        </div>
    );
};
