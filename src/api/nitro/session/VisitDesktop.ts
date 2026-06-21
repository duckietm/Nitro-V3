import { GetRoomSessionManager, NitroLogger } from '@nitrots/nitro-renderer';
import { GetRoomSession } from './GetRoomSession';
import { GoToDesktop } from './GoToDesktop';

export const VisitDesktop = () => {
    if (!GetRoomSession()) return;

    NitroLogger.log('[VisitDesktop] Called (isReconnecting=' + GetRoomSessionManager().isReconnecting + ')');

    GoToDesktop();
    GetRoomSessionManager().removeSession(-1);
};
