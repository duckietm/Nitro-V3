import { FC, PropsWithChildren, ReactNode } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredTriggerBaseViewProps {
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    footer?: ReactNode;
    footerCollapsible?: boolean;
    selectionPreview?: ReactNode;
}

export const WiredTriggerBaseView: FC<PropsWithChildren<WiredTriggerBaseViewProps>> = (props) => {
    const {
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        hasSpecialInput = false,
        children = null,
        footer = null,
        footerCollapsible = true,
        selectionPreview = null
    } = props;

    const onSave = () => save && save();

    return (
        <WiredBaseView
            hasSpecialInput={hasSpecialInput}
            requiresFurni={requiresFurni}
            save={onSave}
            wiredType="trigger"
            footer={footer}
            footerCollapsible={footerCollapsible}
            selectionPreview={selectionPreview}
        >
            {children}
        </WiredBaseView>
    );
};
