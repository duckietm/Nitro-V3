import { DetailedHTMLProps, HTMLAttributes, MouseEvent, PropsWithChildren, Ref } from 'react';
import { DraggableWindow, DraggableWindowPosition, DraggableWindowProps } from '../common';
import { classNames } from './classNames';
import { NitroItemCountBadge } from './NitroItemCountBadge';

type NitroCardRootProps = PropsWithChildren<
    {
        ref?: Ref<HTMLDivElement>;
    } & DraggableWindowProps
> &
    DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const NitroCardRoot = ({
    ref,
    uniqueKey = null,
    handleSelector = '.drag-handler',
    windowPosition = DraggableWindowPosition.CENTER,
    disableDrag = false,
    className = null,
    ...rest
}: NitroCardRootProps) => {
    return (
        <DraggableWindow disableDrag={disableDrag} handleSelector={handleSelector} uniqueKey={uniqueKey} windowPosition={windowPosition}>
            <div
                ref={ref}
                className={classNames('nitro-card-shell flex flex-col overflow-hidden min-w-full min-h-full max-w-full max-h-full', className)}
                {...rest}
            />
        </DraggableWindow>
    );
};

type NitroCardHeaderProps = {
    headerText: string;
    onCloseClick?: (event: MouseEvent) => void;
    ref?: Ref<HTMLDivElement>;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const NitroCardHeader = ({ ref, headerText = '', onCloseClick = null, className = null, ...rest }: NitroCardHeaderProps) => {
    const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    };

    return (
        <div
            ref={ref}
            className={classNames(
                'nitro-card-header-shell relative flex items-center justify-center flex-col drag-handler min-h-card-header max-h-card-header',
                className
            )}
        >
            <div className="flex items-center justify-center w-full ">
                <span className="nitro-card-title text-white">{headerText}</span>
                <div
                    className="absolute flex items-center justify-center cursor-pointer right-2 nitro-card-close-button"
                    onClick={onCloseClick}
                    onMouseDownCapture={onMouseDown}
                />
            </div>
        </div>
    );
};

type NitroCardContentProps = {
    isLoading?: boolean;
    ref?: Ref<HTMLDivElement>;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const NitroCardContent = ({ ref, isLoading = false, className = null, children = null, ...rest }: NitroCardContentProps) => {
    return (
        <div ref={ref} className={classNames('nitro-card-content-shell flex flex-col overflow-auto p-[10px] h-full', className)} {...rest}>
            {isLoading && <div className="absolute top-0 left-0 z-10 opacity-50 size-full bg-muted" />}
            {children}
        </div>
    );
};

type NitroCardTabsProps = {
    ref?: Ref<HTMLDivElement>;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const NitroCardTabs = ({ ref, className = null, ...rest }: NitroCardTabsProps) => {
    return (
        <div
            ref={ref}
            className={classNames('nitro-card-tabs-shell justify-center gap-1 flex min-h-card-tabs max-h-card-tabs px-2 pt-1', className)}
            {...rest}
        />
    );
};

type NitroCardTabItemProps = {
    isActive?: boolean;
    count?: number;
    ref?: Ref<HTMLDivElement>;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const NitroCardTabItem = ({ ref, isActive = false, count = 0, className = null, children = null, ...rest }: NitroCardTabItemProps) => {
    return (
        <div
            ref={ref}
            className={classNames(
                'nitro-card-tab-item overflow-hidden relative cursor-pointer rounded-t-[8px] flex px-3 py-[6px] z-1',
                isActive && 'nitro-card-tab-item-active -mb-px',
                className
            )}
            {...rest}
        >
            <div className="flex items-center justify-center shrink-0">{children}</div>
            {count > 0 && <NitroItemCountBadge count={count} />}
        </div>
    );
};

export const NitroCard = Object.assign(NitroCardRoot, {
    Header: NitroCardHeader,
    Content: NitroCardContent,
    Tabs: NitroCardTabs,
    TabItem: NitroCardTabItem
});
