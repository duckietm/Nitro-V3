import { DeleteBadgeMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { LocalizeBadgeName, LocalizeText, SendMessageComposer, UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker, useNotification } from '../../../../hooks';
import { InfiniteGrid, NitroButton } from '../../../../layout';
import { InventoryBadgeItemView } from './InventoryBadgeItemView';

export const InventoryBadgeView: FC<{ filteredBadgeCodes?: string[] }> = props =>
{
    const { filteredBadgeCodes = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const { badgeCodes = [], activeBadgeCodes = [], selectedBadgeCode = null, isWearingBadge = null, canWearBadges = null, toggleBadge = null, getBadgeId = null, activate = null, deactivate = null } = useInventoryBadges();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();
    const { showConfirm = null } = useNotification();

    const displayCodes = (filteredBadgeCodes !== null ? filteredBadgeCodes : badgeCodes);

    const attemptDeleteBadge = () =>
    {
        if(!selectedBadgeCode) return;

        showConfirm(
            LocalizeText('inventory.delete.confirm_delete.info', [ 'furniname', 'amount' ], [ LocalizeBadgeName(selectedBadgeCode), '1' ]),
            () => SendMessageComposer(new DeleteBadgeMessageComposer(selectedBadgeCode)),
            null,
            null,
            null,
            LocalizeText('inventory.delete.confirm_delete.title')
        );
    };

    useEffect(() =>
    {
        if(!selectedBadgeCode || !isUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode))) return;

        removeUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode));
    }, [ selectedBadgeCode, isUnseen, removeUnseen, getBadgeId ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        const id = activate();

        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    return (
        <div className="grid h-full grid-cols-12 gap-2">
            <div className="flex flex-col col-span-7 gap-1 overflow-hidden">
                <InfiniteGrid<string>
                    columnCount={ 5 }
                    estimateSize={ 50 }
                    itemRender={ item => <InventoryBadgeItemView badgeCode={ item } /> }
                    items={ displayCodes.filter(code => !isWearingBadge(code)) } />
            </div>
            <div className="flex flex-col justify-between col-span-5 overflow-auto">
                <div className="flex flex-col gap-2 overflow-hidden">
                    <span className="text-sm truncate grow">{ LocalizeText('inventory.badges.activebadges') }</span>
                    <InfiniteGrid<string>
                        columnCount={ 3 }
                        estimateSize={ 50 }
                        itemRender={ item => <InventoryBadgeItemView badgeCode={ item } /> }
                        items={ activeBadgeCodes } />
                </div>
                { !!selectedBadgeCode &&
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <LayoutBadgeImageView shrink badgeCode={ selectedBadgeCode } />
                            <span className="text-sm truncate grow">{ LocalizeBadgeName(selectedBadgeCode) }</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <NitroButton
                                className="grow"
                                disabled={ !isWearingBadge(selectedBadgeCode) && !canWearBadges() }
                                onClick={ event => toggleBadge(selectedBadgeCode) }>
                                { LocalizeText(isWearingBadge(selectedBadgeCode) ? 'inventory.badges.clearbadge' : 'inventory.badges.wearbadge') }
                            </NitroButton>
                            { !isWearingBadge(selectedBadgeCode) &&
                                <NitroButton className="!bg-danger hover:!bg-danger/80 p-1" onClick={ attemptDeleteBadge }>
                                    <FaTrashAlt className="fa-icon" />
                                </NitroButton> }
                        </div>
                    </div> }
            </div>
        </div>
    );
};
