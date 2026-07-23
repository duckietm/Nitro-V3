import { FC, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface CatalogAdminModalViewProps {
    title?: ReactNode;
    widthClassName?: string;
    onClose: () => void;
    children?: ReactNode;
}

export const CatalogAdminModalView: FC<CatalogAdminModalViewProps> = (props) => {
    const { title = null, widthClassName = 'w-[420px]', onClose, children = null } = props;

    const onCloseMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2" onClick={onClose}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            <div
                className={`nitro-card-shell nitro-catalog-admin-modal relative flex max-h-[calc(100vh-16px)] ${widthClassName} max-w-[calc(100vw-16px)] flex-col overflow-hidden shadow-lg`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="nitro-card-header-shell relative flex min-h-card-header max-h-card-header items-center justify-center px-3 py-2">
                    <span className="nitro-card-title text-white">{title}</span>
                    <div
                        className="nitro-card-close-button absolute right-2 cursor-pointer"
                        onClick={onClose}
                        onMouseDownCapture={onCloseMouseDown}
                    />
                </div>

                <div className="nitro-catalog-admin-body flex min-h-0 flex-1 flex-col overflow-hidden p-2">{children}</div>
            </div>
        </div>,
        document.body
    );
};
