import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionMovementValidationView: FC<{}> = () => {
    const { setIntParams = null, setStringParam = null } = useWired();

    const save = () => {
        setIntParams([]);
        setStringParam('');
    };

    return <WiredConditionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save} />;
};
