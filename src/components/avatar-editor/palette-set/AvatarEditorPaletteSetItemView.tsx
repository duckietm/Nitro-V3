import { ColorConverter, IPartColor } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { GetClubMemberLevel, GetConfigurationValue } from '../../../api';
import { LayoutCurrencyIcon, LayoutGridItemProps } from '../../../common';
import { InfiniteGrid } from '../../../layout';

export const AvatarEditorPaletteSetItem: FC<{
    setType: string;
    partColor: IPartColor;
    isSelected: boolean;
    width?: string;
} & LayoutGridItemProps> = props =>
{
    const { setType = null, partColor = null, isSelected = false, width = '100%', ...rest } = props;

    if(!partColor) return null;

    const isHC = !GetConfigurationValue<boolean>('hc.disabled', false) && (partColor.clubLevel > 0);
    const isLocked = isHC && (GetClubMemberLevel() < partColor.clubLevel);

    return (
        <InfiniteGrid.Item itemHighlight className={ `clear-bg aspect-square${ isLocked ? ' opacity-50' : '' }` } itemActive={ isSelected } itemColor={ ColorConverter.int2rgb(partColor.rgb) } { ...rest }>
            { isHC && <LayoutCurrencyIcon className="absolute inset-e-1 bottom-1" type="hc" /> }
        </InfiniteGrid.Item>
    );
};
