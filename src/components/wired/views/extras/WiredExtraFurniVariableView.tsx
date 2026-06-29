import { FC } from 'react';
import { localizeWithFallback } from '../../../../api';
import { WiredExtraVariableView } from './WiredExtraUserVariableView';

export const WiredExtraFurniVariableView: FC<{}> = () => {
    return (
        <WiredExtraVariableView
            availabilityRadioName="wiredFurniVariableAvailability"
            availabilityRoomText={localizeWithFallback('wiredfurni.params.variables.availability.1', 'Mentre la stanza è attiva')}
            availabilityRoomValue={1}
        />
    );
};
