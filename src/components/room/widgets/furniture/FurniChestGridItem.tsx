import { FC, useState } from 'react';
import { LayoutFurniImageView, LayoutLimitedEditionStyledNumberView, LayoutRarityLevelView } from '../../../../common';
import { ChestFurniGroup } from './chestFurniGrouping';

const BORDER_IDLE = '#cbcbcb';
const BORDER_HOVER = '#d69586';

export const FurniChestGridItem: FC<{
    group: ChestFurniGroup;
    selected: boolean;
    onSelect: () => void;
    title?: string;
}> = ({ group, selected, onSelect, title }) => {
    const [hovered, setHovered] = useState(false);
    const sample = group.sample;
    const stuff = sample.stuffData;
    const isLtd = (stuff?.uniqueNumber ?? 0) > 0;
    const isRarity = group.specialType === 19;

    return (
        <div
            className="nitro-chest__grid-cell"
            title={title}
            onClick={onSelect}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {selected && <div className="nitro-chest__grid-cell-focus" aria-hidden />}
            <div
                className={`nitro-chest__grid-cell-inner${isLtd ? ' unique-item' : ''}`}
                style={{ borderColor: hovered && !selected ? BORDER_HOVER : BORDER_IDLE, position: 'relative' }}
            >
                {isLtd && (
                    <>
                        <div className="unique-bg-override nitro-chest__grid-ltd-bg" />
                        <div className="absolute bottom-0 unique-item-counter nitro-chest__grid-ltd-counter">
                            <LayoutLimitedEditionStyledNumberView value={stuff?.uniqueNumber ?? 0} />
                        </div>
                    </>
                )}
                <div className="nitro-chest__grid-icon">
                    <LayoutFurniImageView
                        productType={group.wallItem ? 'i' : 's'}
                        productClassId={group.baseItemId}
                        extraData={group.legacyPosterId}
                        direction={2}
                        scale={0.55}
                    />
                </div>
                {isRarity && (
                    <LayoutRarityLevelView
                        className="nitro-chest__grid-rarity"
                        level={stuff?.rarityLevel ?? 0}
                        position="absolute"
                    />
                )}
                {group.quantity > 1 && (
                    <div className="nitro-chest__qty-badge">
                        <span>{group.quantity}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
