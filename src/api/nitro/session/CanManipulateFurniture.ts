import { IRoomSession, RoomControllerLevel } from '@nitrots/api';
import { GetRoomEngine } from '@nitrots/room';
import { GetSessionDataManager } from '@nitrots/session';
import { IsOwnerOfFurniture } from './IsOwnerOfFurniture';

export function CanManipulateFurniture(roomSession: IRoomSession, objectId: number, category: number): boolean
{
    if(!roomSession) return false;

    return (roomSession.isRoomOwner || (roomSession.controllerLevel >= RoomControllerLevel.GUEST) || GetSessionDataManager().isModerator || IsOwnerOfFurniture(GetRoomEngine().getRoomObject(roomSession.roomId, objectId, category)));
}
