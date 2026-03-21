import { RoomObjectCategory, RoomObjectVariable } from '@nitrots/api';
import { GetRoomEngine } from '@nitrots/room';
import { GetSessionDataManager } from '@nitrots/session';
import { GetRoomSession } from './GetRoomSession';

export function IsOwnerOfFloorFurniture(id: number): boolean
{
    const roomObject = GetRoomEngine().getRoomObject(GetRoomSession().roomId, id, RoomObjectCategory.FLOOR);

    if(!roomObject || !roomObject.model) return false;

    const userId = GetSessionDataManager().userId;
    const objectOwnerId = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_OWNER_ID);

    return (userId === objectOwnerId);
}
