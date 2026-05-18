import { GetSessionDataManager, RoomUnitChatStyleComposer, UserSettingsEvent } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';
import { useUserDataSnapshot } from './useSessionSnapshots';

const useSessionInfoState = () =>
{
    // figure / respectsLeft / respectsPetLeft come from the renderer's
    // referentially-stable IUserDataSnapshot. The snapshot is invalidated
    // (and re-derived on next read) inside SessionDataManager whenever
    // the underlying state changes: UserInfoEvent + FigureUpdateEvent +
    // giveRespect/givePetRespect all call invalidateUserDataSnapshot().
    // So we no longer need to mirror those fields into local useState.
    const userData = useUserDataSnapshot();

    const [ chatStyleId, setChatStyleId ] = useState<number>(0);

    const updateChatStyleId = (styleId: number) =>
    {
        setChatStyleId(styleId);

        SendMessageComposer(new RoomUnitChatStyleComposer(styleId));
    };

    const respectUser = (userId: number) => GetSessionDataManager().giveRespect(userId);
    const respectPet = (petId: number) => GetSessionDataManager().givePetRespect(petId);

    useMessageEvent<UserSettingsEvent>(UserSettingsEvent, event =>
    {
        const parser = event.getParser();

        setChatStyleId(parser.chatType);
    });

    return {
        userFigure: userData.figure,
        chatStyleId,
        userRespectRemaining: userData.respectsLeft,
        petRespectRemaining: userData.respectsPetLeft,
        respectUser,
        respectPet,
        updateChatStyleId
    };
};

export const useSessionInfo = () => useBetween(useSessionInfoState);
