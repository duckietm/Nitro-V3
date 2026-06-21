import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

interface CatalogAdminModalViewProps {
    title?: ReactNode;
    widthClassName?: string;
    onClose: () => void;
    children?: ReactNode;
}

export const CatalogAdminModalView: FC<CatalogAdminModalViewProps> = (props) => {
    const { title = null, widthClassName = 'w-[420px]', onClose, children = null } = props;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2" onClick={onClose}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            <div
                className={`nitro-card-shell nitro-catalog-admin-modal relative flex max-h-[calc(100vh-16px)] ${widthClassName} max-w-[calc(100vw-16px)] flex-col overflow-hidden shadow-lg`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="nitro-card-header-shell flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-bold text-white">{title}</span>
                    <div className="nitro-catalog-admin-close cursor-pointer" onClick={onClose}>
                        <FaTimes className="text-white/70 hover:text-white text-xs" />
                    </div>
                </div>

                <div className="nitro-catalog-admin-body flex min-h-0 flex-col gap-2.5 overflow-y-auto p-3">{children}</div>
            </div>
        </div>,
        document.body
    );
};
