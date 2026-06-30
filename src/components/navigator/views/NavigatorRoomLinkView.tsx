import { FC } from 'react';
import { GetConfigurationValue, LocalizeText } from '../../../api';
import { LayoutRoomThumbnailView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../common';
import { useNavigatorData } from '../../../hooks';

export class NavigatorRoomLinkViewProps {
    onCloseClick: () => void;
}

export const NavigatorRoomLinkView: FC<NavigatorRoomLinkViewProps> = (props) => {
    const { onCloseClick = null } = props;
    const { navigatorData } = useNavigatorData();

    if (!navigatorData.enteredGuestRoom) return null;

    return (
        <NitroCardView className="nitro-room-link min-w-0 w-[min(430px,calc(100vw-16px))] max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]" theme="primary-slim">
            <NitroCardHeaderView headerText={LocalizeText('navigator.embed.title')} onCloseClick={onCloseClick} />
            <NitroCardContentView className="text-black flex items-center max-h-[calc(100vh-72px)]" overflow="auto">
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                    <LayoutRoomThumbnailView customUrl={navigatorData.enteredGuestRoom.officialRoomPicRef} roomId={navigatorData.enteredGuestRoom.roomId} />
                    <div className="flex flex-col min-w-0">
                        <Text bold fontSize={5}>
                            {LocalizeText('navigator.embed.headline')}
                        </Text>
                        <Text>{LocalizeText('navigator.embed.info')}</Text>
                        <input
                            readOnly
                            className="min-h-[calc(1.5em+ .5rem+2px)] px-[.5rem] py-[.25rem] rounded-[.2rem] form-control-sm w-full min-w-0"
                            type="text"
                            value={LocalizeText('navigator.embed.src', ['roomId'], [navigatorData.enteredGuestRoom.roomId.toString()]).replace(
                                '${url.prefix}',
                                GetConfigurationValue<string>('url.prefix', '')
                            )}
                        />
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
