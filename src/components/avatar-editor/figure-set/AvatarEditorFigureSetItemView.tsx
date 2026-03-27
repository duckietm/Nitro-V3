import { FC, useEffect, useState } from 'react';
import { AvatarEditorThumbnailsHelper, GetClubMemberLevel, GetConfigurationValue, IAvatarEditorCategoryPartItem } from '../../../api';
import { LayoutCurrencyIcon, LayoutGridItemProps } from '../../../common';
import { useAvatarEditor } from '../../../hooks';
import { InfiniteGrid } from '../../../layout';
import { AvatarEditorIcon } from '../AvatarEditorIcon';

export const AvatarEditorFigureSetItemView: FC<{
    setType: string;
    partItem: IAvatarEditorCategoryPartItem;
    isSelected: boolean;
    width?: string;
} & LayoutGridItemProps> = props =>
{
    const { setType = null, partItem = null, isSelected = false, width = '100%', ...rest } = props;
    const [ assetUrl, setAssetUrl ] = useState<string>('');
    const { selectedColorParts = null, getFigureStringWithFace = null } = useAvatarEditor();

    const clubLevel = partItem.partSet?.clubLevel ?? 0;
    const isHC = !GetConfigurationValue<boolean>('hc.disabled', false) && (clubLevel > 0);
    const isLocked = isHC && (GetClubMemberLevel() < clubLevel);
    const isSellableNotOwned = partItem.isSellableNotOwned ?? false;

    useEffect(() =>
    {
        setAssetUrl('');

        if(!setType || !setType.length || !partItem || partItem.isClear) return;

        const loadImage = async () =>
        {
            const partClubLevel = partItem.partSet?.clubLevel ?? 0;
            const partIsHC = !GetConfigurationValue<boolean>('hc.disabled', false) && (partClubLevel > 0);
            const partIsLocked = partIsHC && (GetClubMemberLevel() < partClubLevel);

            let url: string = null;

            if(setType === 'hd')
            {
                url = await AvatarEditorThumbnailsHelper.buildForFace(getFigureStringWithFace(partItem.id), partIsLocked || isSellableNotOwned);
            }
            else
            {
                url = await AvatarEditorThumbnailsHelper.build(
                    setType,
                    partItem,
                    partItem.usesColor,
                    selectedColorParts[setType] ?? null,
                    partIsLocked || isSellableNotOwned
                );
            }

            if(url && url.length) setAssetUrl(url);
        };

        loadImage();
    }, [ setType, partItem, selectedColorParts, getFigureStringWithFace, isSellableNotOwned ]);

    if(!partItem) return null;

    const isHead = (setType === 'hd');

    return (
        <InfiniteGrid.Item
            itemActive={ isSelected }
            itemImage={ (!partItem.isClear && isHead) ? assetUrl : undefined }
            className={ `avatar-parts mx-auto${ isSelected ? ' part-selected' : '' }${ !partItem.isClear && isSellableNotOwned ? ' pet-sellable-locked' : '' }` }
            style={ isHead ? { backgroundSize: '200%', backgroundPosition: 'center -32px' } : undefined }
            { ...rest }
        >
            { !partItem.isClear && assetUrl && !isHead &&
                <img
                    src={ assetUrl }
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none image-rendering-pixelated"
                    draggable={ false }
                /> }
            { !partItem.isClear && isHC && <LayoutCurrencyIcon className="absolute inset-e-1 bottom-1" type="hc" /> }
            { partItem.isClear && <AvatarEditorIcon icon="clear" /> }
            { !partItem.isClear && partItem.partSet.isSellable && !isSellableNotOwned && <AvatarEditorIcon className="inset-e-1 bottom-1 absolute" icon="sellable" /> }
            { !partItem.isClear && isSellableNotOwned &&
                <div className="pet-sellable-badge">
                    <LayoutCurrencyIcon type={ -1 } />
                </div> }
        </InfiniteGrid.Item>
    );
};
