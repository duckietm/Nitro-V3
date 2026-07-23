import { SendMessageComposer as SendPacket } from '../../../api';
import { createMessengerHistoryController } from './messengerControllers';
import { useMessengerStore } from './useMessengerStore';

export const useMessengerHistory = () =>
{
    const { getState, dispatch } = useMessengerStore();
    return createMessengerHistoryController(getState, dispatch, SendPacket);
};
