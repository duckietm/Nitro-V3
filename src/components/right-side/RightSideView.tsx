import { FC } from 'react';
import { Column } from '../../common';
import { OfferView } from '../catalog/views/targeted-offer/OfferView';
import { GroupRoomInformationView } from '../groups/views/GroupRoomInformationView';
import { NotificationCenterView } from '../notification-center/NotificationCenterView';
import { PurseView } from '../purse/PurseView';
import { MysteryBoxExtensionView } from '../room/widgets/mysterybox/MysteryBoxExtensionView';
import { RoomPromotesWidgetView } from '../room/widgets/room-promotes/RoomPromotesWidgetView';

export const RightSideView: FC<{}> = props =>
{
    return (
        <div className="absolute top-0 right-[8px] z-10 w-[min(188px,calc(100vw-16px))] sm:right-[10px] sm:w-[min(188px,calc(100vw-20px))] h-[calc(100%-55px)] pointer-events-none">
            <Column gap={ 1 } position="relative" className="w-full">
                <PurseView />
                <GroupRoomInformationView />
                <MysteryBoxExtensionView />
                <OfferView />
                <RoomPromotesWidgetView />
                <NotificationCenterView />
            </Column>
        </div>
    );
};
