import { FC, PropsWithChildren } from 'react';
import { UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';
import { InfiniteGrid } from '../../../../layout';

export const InventoryBadgeItemView: FC<PropsWithChildren<{ badgeCode: string }>> = props =>
{
    const { badgeCode = null, children = null, ...rest } = props;
    const { selectedBadgeCode = null, setSelectedBadgeCode = null, toggleBadge = null, getBadgeId = null } = useInventoryBadges();
    const { isUnseen = null } = useInventoryUnseenTracker();
    const unseen = isUnseen(UnseenItemCategory.BADGE, getBadgeId(badgeCode));

    const onDragStart = (event: React.DragEvent<HTMLDivElement>) =>
    {
        event.dataTransfer.setData('badgeCode', badgeCode);
        event.dataTransfer.setData('source', 'inventory');
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <InfiniteGrid.Item
            draggable
            itemActive={ (selectedBadgeCode === badgeCode) }
            itemUnseen={ unseen }
            onDoubleClick={ event => toggleBadge(selectedBadgeCode) }
            onDragStart={ onDragStart }
            onMouseDown={ event => setSelectedBadgeCode(badgeCode) }
            { ...rest }>
            <LayoutBadgeImageView badgeCode={ badgeCode } />
            { children }
        </InfiniteGrid.Item>
    );
};
