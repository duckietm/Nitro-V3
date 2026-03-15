import { FC, PropsWithChildren, ReactNode } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredConditionBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    footer?: ReactNode;
}

export const WiredConditionBaseView: FC<PropsWithChildren<WiredConditionBaseViewProps>> = props =>
{
    const { requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, hasSpecialInput = false, children = null, footer = null } = props;

    const onSave = () => (save && save());

    return (
        <WiredBaseView hasSpecialInput={ hasSpecialInput } requiresFurni={ requiresFurni } save={ onSave } wiredType="condition" footer={ footer }>
            { children }
        </WiredBaseView>
    );
};
