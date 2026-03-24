import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

export const WiredExtraUnseenView: FC<{}> = () =>
{
    const { setIntParams = null, setStringParam = null } = useWired();

    const save = () =>
    {
        setIntParams([]);
        setStringParam('');
    };

    return <WiredExtraBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save } cardStyle={ { width: 320 } } />;
};
