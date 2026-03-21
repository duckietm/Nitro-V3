import { RoomObjectVariable } from '@nitrots/api';
import { RoomEngineTriggerWidgetEvent } from '@nitrots/events';
import { GetRoomEngine } from '@nitrots/room';
import { CreateLinkEvent } from '@nitrots/utils';
import { useNitroEvent } from '../../../events';

const INTERNALLINK = 'internalLink';

const useFurnitureInternalLinkWidgetState = () =>
{
    useNitroEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REQUEST_INTERNAL_LINK, event =>
    {
        const roomObject = GetRoomEngine().getRoomObject(event.roomId, event.objectId, event.category);

        if(!roomObject) return;

        const data = roomObject.model.getValue<any>(RoomObjectVariable.FURNITURE_DATA);

        let link = data[INTERNALLINK];

        if(!link || !link.length) link = roomObject.model.getValue<string>(RoomObjectVariable.FURNITURE_INTERNAL_LINK);

        if(link && link.length) CreateLinkEvent(link);
    });

    return {};
};

export const useFurnitureInternalLinkWidget = useFurnitureInternalLinkWidgetState;
