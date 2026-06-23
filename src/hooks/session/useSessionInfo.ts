import { GetSessionDataManager, RoomUnitChatStyleComposer, UserInfoDataParser, UserInfoEvent, UserSettingsEvent } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';
import { useUserDataSnapshot } from './useSessionSnapshots';

// State function — ONLY use-between-safe hooks here (useState,
// useMessageEvent, plain actions). Do NOT call snapshot hooks here:
// use-between's dispatcher does not implement useSyncExternalStore, so
// any `useUserDataSnapshot()` / `useExternalSnapshot()` call inside
// this body crashes the React tree on first paint with
// "(intermediate value)() is undefined". See useSessionSnapshots.test.tsx
// for the regression guard.
const useSessionInfoState = () => {
    const [userInfo, setUserInfo] = useState<UserInfoDataParser>(null);
    const [chatStyleId, setChatStyleId] = useState<number>(0);

    const updateChatStyleId = (styleId: number) => {
        setChatStyleId(styleId);

        SendMessageComposer(new RoomUnitChatStyleComposer(styleId));
    };

    const respectUser = (userId: number) => GetSessionDataManager().giveRespect(userId);
    const respectPet = (petId: number) => GetSessionDataManager().givePetRespect(petId);

    useMessageEvent<UserInfoEvent>(UserInfoEvent, (event) => {
        setUserInfo(event.getParser().userInfo);
    });

    useMessageEvent<UserSettingsEvent>(UserSettingsEvent, (event) => {
        setChatStyleId(event.getParser().chatType);
    });

    return { userInfo, chatStyleId, respectUser, respectPet, updateChatStyleId };
};

// Public surface — snapshot reads happen in the OUTER wrapper, in the
// real React dispatcher's scope, so useSyncExternalStore installs
// correctly. useBetween only proxies the non-snapshot slice, where its
// dispatcher works fine. SessionDataManager already invalidates the
// snapshot on UserInfoEvent / FigureUpdateEvent / giveRespect /
// givePetRespect, so userFigure / respectsLeft / respectsPetLeft stay
// in sync without local useState mirrors.
export const useSessionInfo = () => {
    const shared = useBetween(useSessionInfoState);
    const userData = useUserDataSnapshot();

    return {
        ...shared,
        userFigure: userData.figure,
        userRespectRemaining: userData.respectsLeft,
        petRespectRemaining: userData.respectsPetLeft
    };
};
