import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import { WiredExtraVariableView } from './WiredExtraUserVariableView';

export const WiredExtraFurniVariableView: FC<{}> = () => {
    return (
        <WiredExtraVariableView
            availabilityRadioName="wiredFurniVariableAvailability"
            availabilityRoomText={LocalizeText('wiredfurni.params.variables.availability.1')}
            availabilityRoomValue={1}
        />
    );
};
