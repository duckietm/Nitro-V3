import { DetailedHTMLProps, forwardRef, HTMLAttributes, PropsWithChildren } from 'react';
import { classNames } from '../../layout';

export const ToolbarItemView = forwardRef<HTMLDivElement, PropsWithChildren<{
    icon: string;
}> & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>((props, ref) =>
{
    const { icon = null, className = null, ...rest } = props;

    return (
        <div
            ref={ ref }
            className={ classNames(
                'relative h-[32px] w-[32px] shrink-0 cursor-pointer bg-center bg-no-repeat transition-transform duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0',
                `nitro-icon icon-${ icon }`,
                className
            ) }
            { ...rest } />
    );
});

ToolbarItemView.displayName = 'ToolbarItemView';
