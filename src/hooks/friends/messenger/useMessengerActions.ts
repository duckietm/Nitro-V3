import { GetSessionDataManager } from '@nitrots/nitro-renderer';
import { SendMessageComposer as SendPacket } from '../../../api';
import { createMessengerActionsController } from './messengerControllers';
import { useMessengerStore } from './useMessengerStore';

export const useMessengerActions = () =>
{
    const { getState, dispatch } = useMessengerStore();
    return createMessengerActionsController(getState, dispatch, SendPacket, () => GetSessionDataManager().userId);
};
