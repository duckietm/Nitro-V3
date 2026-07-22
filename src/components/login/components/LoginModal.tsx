import { FC, MouseEvent, PropsWithChildren, useEffect } from 'react';

interface LoginModalProps extends PropsWithChildren {
    title: string;
    titleId: string;
    closeLabel: string;
    dialogClassName?: string;
    onClose: () => void;
}

export const LoginModal: FC<LoginModalProps> = ({ title, titleId, closeLabel, dialogClassName = '', onClose, children }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            event.preventDefault();
            onClose();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return (
        <div className="nitro-login-modal" onClick={handleOverlayClick}>
            <div className={`dialog ${dialogClassName}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="nitro-login-card">
                    <div className="card-title">
                        <span id={titleId}>{title}</span>
                        <button type="button" className="nitro-card-close-button" aria-label={closeLabel} onClick={onClose} />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};
