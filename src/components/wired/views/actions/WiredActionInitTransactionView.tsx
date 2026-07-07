import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionInitTransactionView: FC<{}> = () => {
    const { setIntParams = null } = useWired();
    const save = () => setIntParams([]);

    return (
        <WiredActionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <Text small>
                Pick the Contract furni above to execute. Their terms are checked and applied atomically:
                on success the "Transaction Completed" triggers fire, otherwise "Transaction Failed".
                With no contract selected it simply fires "Transaction Completed".
            </Text>
        </WiredActionBaseView>
    );
};
