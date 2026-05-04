import { FC, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LocalizeBadgeDescription, LocalizeBadgeName } from '../../api';
import { Flex, LayoutBadgeImageView } from '../../common';

interface BadgeInfoViewProps
{
    badgeCode: string;
}

export const BadgeInfoView: FC<BadgeInfoViewProps> = props =>
{
    const { badgeCode } = props;
    const [ tooltipPos, setTooltipPos ] = useState<{ top: number; left: number } | null>(null);
    const slotRef = useRef<HTMLDivElement>(null);

    const onMouseEnter = useCallback(() =>
    {
        if(!slotRef.current) return;

        const rect = slotRef.current.getBoundingClientRect();
        const tooltipWidth = 180;
        const tooltipHeight = 60;
        const gap = 6;

        let left = (rect.left + (rect.width / 2)) - (tooltipWidth / 2);

        if(left < gap) left = gap;
        if((left + tooltipWidth) > (window.innerWidth - gap)) left = window.innerWidth - tooltipWidth - gap;

        const top = (rect.bottom + gap + tooltipHeight) > window.innerHeight
            ? rect.top - gap - tooltipHeight
            : rect.bottom + gap;

        setTooltipPos({ top, left });
    }, []);

    const onMouseLeave = useCallback(() => setTooltipPos(null), []);

    return (
        <Flex center
            innerRef={ slotRef }
            className="nitro-card-panel w-[45px] h-[45px] relative cursor-pointer"
            onMouseEnter={ onMouseEnter }
            onMouseLeave={ onMouseLeave }
        >
            <LayoutBadgeImageView badgeCode={ badgeCode } />
            { tooltipPos && createPortal(
                <div
                    className="fixed z-50 w-[180px] border border-[#c4cabf] bg-[#f2f2eb] px-2 py-1 text-xs text-black shadow-none pointer-events-none rounded-[6px]"
                    style={ { top: tooltipPos.top, left: tooltipPos.left } }
                >
                    <div className="font-bold mb-0.5">{ LocalizeBadgeName(badgeCode) }</div>
                    <div className="text-gray-600">{ LocalizeBadgeDescription(badgeCode) }</div>
                </div>,
                document.body
            ) }
        </Flex>
    );
};
