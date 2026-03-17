import { FC, useEffect } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const CLICK_TILE_INTERACTION_TYPES = [ 'room_invisible_click_tile' ];

export const WiredTriggerClickTileView: FC<{}> = () =>
{
    const { setAllowedInteractionTypes } = useWired();

    useEffect(() =>
    {
        setAllowedInteractionTypes(CLICK_TILE_INTERACTION_TYPES);

        return () => setAllowedInteractionTypes(null);
    }, [ setAllowedInteractionTypes ]);

    return <WiredTriggerBaseView hasSpecialInput={ false } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE } save={ null } />;
};
