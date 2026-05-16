import { DetailedHTMLProps, forwardRef, HTMLAttributes, memo, PropsWithChildren } from 'react';
import { classNames } from '../../layout';

export const ToolbarItemView = memo(
    forwardRef<
        HTMLDivElement,
        PropsWithChildren<{
            icon: string;
        }> &
            DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
    >((props, ref) => {
        const { icon = null, className = null, ...rest } = props;

        return (
            <div
                ref={ref}
                className={classNames('cursor-pointer relative', `nitro-icon icon-${icon}`, className)}
                {...rest}
            />
        );
    })
);

ToolbarItemView.displayName = 'ToolbarItemView';
