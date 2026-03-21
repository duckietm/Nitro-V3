import { GetRoomSessionManager } from '@nitrots/session';
import { GetRoomSession } from './GetRoomSession';
import { GoToDesktop } from './GoToDesktop';

export const VisitDesktop = () =>
{
    if(!GetRoomSession()) return;

    GoToDesktop();
    GetRoomSessionManager().removeSession(-1);
};
