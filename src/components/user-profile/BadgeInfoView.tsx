import { FC, useState } from 'react';
import { LocalizeBadgeDescription, LocalizeBadgeName } from '../../api';
import { Flex, LayoutBadgeImageView } from '../../common';

interface BadgeInfoViewProps
{
    badgeCode: string;
}

export const BadgeInfoView: FC<BadgeInfoViewProps> = props =>
{
    const { badgeCode } = props;
    const [ isHovered, setIsHovered ] = useState(false);

    return (
        <Flex center
            className="w-[45px] h-[45px] rounded bg-white/50 relative cursor-pointer"
            onMouseEnter={ () => setIsHovered(true) }
            onMouseLeave={ () => setIsHovered(false) }
        >
            <LayoutBadgeImageView badgeCode={ badgeCode } />
            { isHovered && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white text-black rounded shadow-lg py-1 px-2 text-xs w-[180px] pointer-events-none">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                    <div className="font-bold mb-0.5">{ LocalizeBadgeName(badgeCode) }</div>
                    <div className="text-gray-600">{ LocalizeBadgeDescription(badgeCode) }</div>
                </div>
            ) }
        </Flex>
    );
};
