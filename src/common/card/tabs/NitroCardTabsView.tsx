import { FC, useMemo } from 'react';
import { useUiSettings } from '../../../api';
import { Flex, FlexProps } from '../..';

export const NitroCardTabsView: FC<FlexProps> = props =>
{
    const { justifyContent = 'center', gap = 1, classNames = [], children = null, ...rest } = props;
    const { isCustomActive, getTabsStyle } = useUiSettings();

    const getClassNames = useMemo(() =>
    {
        const base = isCustomActive
            ? 'justify-center gap-0.5 flex min-h-card-tabs max-h-card-tabs pt-1 border-b border-card-border px-2 -mt-px'
            : 'justify-center gap-0.5 flex bg-card-tabs min-h-card-tabs max-h-card-tabs pt-1 border-b border-card-border px-2 -mt-px';

        const newClassNames: string[] = [ base ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames, isCustomActive ]);

    return (
        <Flex classNames={ getClassNames } gap={ gap } justifyContent={ justifyContent } style={ getTabsStyle() } { ...rest }>
            { children }
        </Flex>
    );
};
