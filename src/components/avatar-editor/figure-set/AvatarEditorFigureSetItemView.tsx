import { AvatarFigurePartType } from '@nitrots/nitro-renderer';
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

    useEffect(() =>
    {
        if(!setType || !setType.length || !partItem) return;

        const loadImage = async () =>
        {
            const partClubLevel = partItem.partSet?.clubLevel ?? 0;
            const partIsHC = !GetConfigurationValue<boolean>('hc.disabled', false) && (partClubLevel > 0);
            const partIsLocked = partIsHC && (GetClubMemberLevel() < partClubLevel);

            let url: string = null;

            if(setType === AvatarFigurePartType.HEAD)
            {
                url = await AvatarEditorThumbnailsHelper.buildForFace(getFigureStringWithFace(partItem.id), partIsLocked);
            }
            else
            {
                url = await AvatarEditorThumbnailsHelper.build(setType, partItem, partItem.usesColor, selectedColorParts[setType] ?? null, partIsLocked);
            }

            if(url && url.length) setAssetUrl(url);
        };

        loadImage();
    }, [ setType, partItem, selectedColorParts, getFigureStringWithFace ]);

    if(!partItem) return null;

    return (
        <InfiniteGrid.Item itemActive={ isSelected } itemImage={ (partItem.isClear ? undefined : assetUrl) } className={ `avatar-parts mx-auto${ isSelected ? ' part-selected' : '' }` } style={ { backgroundPosition: (setType === AvatarFigurePartType.HEAD) ? 'center -35px' : 'center' } } { ...rest }>
            { !partItem.isClear && isHC && <LayoutCurrencyIcon className="absolute inset-e-1 bottom-1" type="hc" /> }
            { partItem.isClear && <AvatarEditorIcon icon="clear" /> }
            { !partItem.isClear && partItem.partSet.isSellable && <AvatarEditorIcon className="inset-e-1 bottom-1 absolute" icon="sellable" /> }
        </InfiniteGrid.Item>
    );
};
