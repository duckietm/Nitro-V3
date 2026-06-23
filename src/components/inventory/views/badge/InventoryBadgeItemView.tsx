import { FC, PropsWithChildren, useState } from 'react';
import { GetConfigurationValue, UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';
import { InfiniteGrid } from '../../../../layout';

export const InventoryBadgeItemView: FC<PropsWithChildren<{ badgeCode: string }>> = (props) => {
    const { badgeCode = null, children = null, ...rest } = props;
    const { selectedBadgeCode = null, setSelectedBadgeCode = null, toggleBadge = null, getBadgeId = null } = useInventoryBadges();
    const { isUnseen = null } = useInventoryUnseenTracker();
    const unseen = isUnseen(UnseenItemCategory.BADGE, getBadgeId(badgeCode));
    const [isDragging, setIsDragging] = useState(false);

    const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('badgeCode', badgeCode);
        event.dataTransfer.setData('source', 'inventory');
        event.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);

        const badgeUrl = GetConfigurationValue<string>('badge.asset.url').replace('%badgename%', badgeCode);
        const img = new Image();
        img.src = badgeUrl;
        event.dataTransfer.setDragImage(img, 20, 20);
    };

    const onDragEnd = () => setIsDragging(false);

    return (
        <InfiniteGrid.Item
            draggable
            className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 scale-95' : ''}`}
            itemActive={selectedBadgeCode === badgeCode}
            itemUnseen={unseen}
            onDoubleClick={(event) => toggleBadge(selectedBadgeCode)}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            onMouseDown={(event) => setSelectedBadgeCode(badgeCode)}
            {...rest}
        >
            <LayoutBadgeImageView badgeCode={badgeCode} />
            {children}
        </InfiniteGrid.Item>
    );
};
