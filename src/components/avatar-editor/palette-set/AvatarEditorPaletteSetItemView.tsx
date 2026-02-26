import { IPartColor } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { ColorUtils, GetClubMemberLevel, GetConfigurationValue } from '../../../api';
import { LayoutCurrencyIcon, LayoutGridItemProps } from '../../../common';
import { InfiniteGrid } from '../../../layout';

export const AvatarEditorPaletteSetItem: FC<{
    partColor: IPartColor;
    isSelected: boolean;
} & LayoutGridItemProps> = props =>
{
    const { partColor = null, isSelected = false, style = {}, ...rest } = props;

    if(!partColor) return null;

    const isHC = !GetConfigurationValue<boolean>('hc.disabled', false) && (partColor.clubLevel > 0);
    const isLocked = isHC && (GetClubMemberLevel() < partColor.clubLevel);

    return (
        <InfiniteGrid.Item
            itemHighlight
            className={ `clear-bg${ isLocked ? ' opacity-50' : '' }` }
            itemActive={ isSelected }
            itemColor={ ColorUtils.makeColorNumberHex(partColor.rgb & 0xFFFFFF) }
            style={ {
                aspectRatio: '1 / 1',
                minHeight: '14px',
                ...style
            } }
            { ...rest }>
            { isHC && <LayoutCurrencyIcon className="absolute inset-e-1 bottom-1" type="hc" /> }
        </InfiniteGrid.Item>
    );
};
