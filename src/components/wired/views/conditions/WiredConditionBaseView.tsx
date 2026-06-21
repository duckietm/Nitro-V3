import { CSSProperties, FC, PropsWithChildren, ReactNode } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredConditionBaseViewProps {
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    validate?: () => boolean;
    cardStyle?: CSSProperties;
    footer?: ReactNode;
    footerCollapsible?: boolean;
    selectionPreview?: ReactNode;
}

export const WiredConditionBaseView: FC<PropsWithChildren<WiredConditionBaseViewProps>> = (props) => {
    const {
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        validate = null,
        cardStyle = undefined,
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
            validate={validate}
            cardStyle={cardStyle}
            wiredType="condition"
            footer={footer}
            footerCollapsible={footerCollapsible}
            selectionPreview={selectionPreview}
        >
            {children}
        </WiredBaseView>
    );
};
