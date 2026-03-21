import { GetRoomSessionManager } from '@nitrots/session';

export const GetRoomSession = () => GetRoomSessionManager().getSession(-1);
