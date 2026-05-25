import { DetailedHTMLProps, HTMLAttributes, PropsWithChildren, Ref } from 'react';
import { classNames } from './classNames';

const classes = {
    base: 'text-[white] font-bold leading-none text-[9.5px] absolute right-0 top-0    py-0.5 px-[3px] z-1 rounded border',
    themes: {
        'primary': 'border-black bg-red-700'
    }
};

type NitroItemCountBadgeProps = PropsWithChildren<{
    theme?: 'primary';
    count: number;
    ref?: Ref<HTMLDivElement>;
}> & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export const NitroItemCountBadge = ({ ref, theme = 'primary', count = 0, className = null, children = null, ...rest }: NitroItemCountBadgeProps) =>
{
    return (
        <div
            ref={ ref }
            className={ classNames(
                classes.base,
                classes.themes[theme],
                className
            ) }
            { ...rest }>
            { count }
            { children }
        </div>
    );
};
