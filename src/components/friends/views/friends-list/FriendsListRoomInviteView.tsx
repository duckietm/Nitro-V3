import { FC, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Button, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';

interface FriendsRoomInviteViewProps
{
    selectedFriendsIds: number[];
    onCloseClick: () => void;
    sendRoomInvite: (message: string) => void;
}

export const FriendsRoomInviteView: FC<FriendsRoomInviteViewProps> = props =>
{
    const { selectedFriendsIds = null, onCloseClick = null, sendRoomInvite = null } = props;
    const [ roomInviteMessage, setRoomInviteMessage ] = useState<string>('');

    return (
        <NitroCardView className="nitro-friends-room-invite min-w-0 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]" theme="primary-slim" uniqueKey="nitro-friends-room-invite" isResizable={ false }>
            <NitroCardHeaderView headerText={ LocalizeText('friendlist.invite.title') } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="nitro-friends-room-invite-content text-black" gap={ 2 }>
                <Text className="nitro-friends-room-invite-summary">{ LocalizeText('friendlist.invite.summary', [ 'count' ], [ selectedFriendsIds.length.toString() ]) }</Text>
                <textarea className="nitro-friends-room-invite-textarea" maxLength={ 255 } value={ roomInviteMessage } onChange={ event => setRoomInviteMessage(event.target.value) }></textarea>
                <Text center className="nitro-friends-room-invite-note">{ LocalizeText('friendlist.invite.note') }</Text>
                <div className="nitro-friends-room-invite-actions">
                    <Button fullWidth disabled={ ((roomInviteMessage.length === 0) || (selectedFriendsIds.length === 0)) } variant="success" onClick={ () => sendRoomInvite(roomInviteMessage) }>{ LocalizeText('friendlist.invite.send') }</Button>
                    <Button fullWidth onClick={ onCloseClick }>{ LocalizeText('generic.cancel') }</Button>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
