import { FC, MouseEvent, useMemo } from 'react';
import { Flex, FlexProps } from '../../../../common';

interface ContextMenuListItemViewProps extends FlexProps
{
    disabled?: boolean;
}

export const ContextMenuListItemView: FC<ContextMenuListItemViewProps> = props =>
{
    const { disabled = false, fullWidth = true, justifyContent = 'center', alignItems = 'center', classNames = [], style = {}, onClick = null, ...rest } = props;

    const handleClick = (event: MouseEvent<HTMLDivElement>) =>
    {
        if(disabled) return;

        if(onClick) onClick(event);
    };

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'relative mb-[2px] p-[3px] overflow-hidden', 'h-[24px] max-h-[24px] p-[3px] cursor-pointer' ];

        if(disabled) newClassNames.push('disabled');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ disabled, classNames ]);

    const mergedStyle = useMemo(() => ({
        background: 'repeating-linear-gradient(var(--ui-ctx-item-bg1, #131e25), var(--ui-ctx-item-bg1, #131e25) 50%, var(--ui-ctx-item-bg2, #0d171d) 50%, var(--ui-ctx-item-bg2, #0d171d) 100%)',
        ...style
    }), [ style ]);

    return <Flex alignItems={ alignItems } classNames={ getClassNames } fullWidth={ fullWidth } justifyContent={ justifyContent } onClick={ handleClick } style={ mergedStyle } { ...rest } />;
};
