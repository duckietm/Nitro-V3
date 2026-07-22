import { AddLinkEventTracker, CreateLinkEvent, ILinkEventTracker, NitroSettingsEvent, RemoveLinkEventTracker, UserSettingsCameraFollowComposer, UserSettingsEvent, UserSettingsOldChatComposer, UserSettingsPrivacyComposer, UserSettingsRoomInvitesComposer, UserSettingsSoundComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaUserCog, FaVolumeDown, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { DispatchMainEvent, DispatchUiEvent, LocalizeText, SendMessageComposer } from '../../api';
import { Button, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useCatalogPlaceMultipleItems, useCatalogSkipPurchaseConfirmation, useChatWindow, useMessageEvent } from '../../hooks';
import { classNames } from '../../layout';

const localizeWithFallback = (key: string, fallback: string) =>
{
    const text = LocalizeText(key);
    return (text && text !== key) ? text : fallback;
};

// null = full window (legacy). 'audio' | 'chat' | 'other' = focused section
// opened from the purse gear dropdown.
type SettingsSection = null | 'audio' | 'chat' | 'other' | 'privacy';

export const UserSettingsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ section, setSection ] = useState<SettingsSection>(null);
    const [ userSettings, setUserSettings ] = useState<NitroSettingsEvent>(null);
    const [ catalogPlaceMultipleObjects, setCatalogPlaceMultipleObjects ] = useCatalogPlaceMultipleItems();
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useCatalogSkipPurchaseConfirmation();
    const [ chatWindowEnabled, setChatWindowEnabled ] = useChatWindow();

    const processAction = (type: string, value?: boolean | number | string) =>
    {
        let doUpdate = true;

        const clone = userSettings.clone();

        switch(type)
        {
            case 'close_view':
                setIsVisible(false);
                doUpdate = false;
                return;
            case 'oldchat':
                clone.oldChat = value as boolean;
                SendMessageComposer(new UserSettingsOldChatComposer(clone.oldChat));
                break;
            case 'room_invites':
                clone.roomInvites = value as boolean;
                SendMessageComposer(new UserSettingsRoomInvitesComposer(clone.roomInvites));
                break;
            case 'camera_follow':
                clone.cameraFollow = value as boolean;
                SendMessageComposer(new UserSettingsCameraFollowComposer(clone.cameraFollow));
                break;
            case 'online_status_visible':
                clone.onlineStatusVisible = value as boolean;
                SendMessageComposer(new UserSettingsPrivacyComposer(clone.onlineStatusVisible, clone.friendsCanFollow, clone.friendRequestsAllowed));
                break;
            case 'friends_can_follow':
                clone.friendsCanFollow = value as boolean;
                SendMessageComposer(new UserSettingsPrivacyComposer(clone.onlineStatusVisible, clone.friendsCanFollow, clone.friendRequestsAllowed));
                break;
            case 'friend_requests_allowed':
                clone.friendRequestsAllowed = value as boolean;
                SendMessageComposer(new UserSettingsPrivacyComposer(clone.onlineStatusVisible, clone.friendsCanFollow, clone.friendRequestsAllowed));
                break;
            case 'system_volume':
                clone.volumeSystem = value as number;
                clone.volumeSystem = Math.max(0, clone.volumeSystem);
                clone.volumeSystem = Math.min(100, clone.volumeSystem);
                break;
            case 'furni_volume':
                clone.volumeFurni = value as number;
                clone.volumeFurni = Math.max(0, clone.volumeFurni);
                clone.volumeFurni = Math.min(100, clone.volumeFurni);
                break;
            case 'trax_volume':
                clone.volumeTrax = value as number;
                clone.volumeTrax = Math.max(0, clone.volumeTrax);
                clone.volumeTrax = Math.min(100, clone.volumeTrax);
                break;
        }

        if(doUpdate) setUserSettings(clone);

        DispatchMainEvent(clone);
    };

    const saveRangeSlider = (type: string) =>
    {
        switch(type)
        {
            case 'volume':
                SendMessageComposer(new UserSettingsSoundComposer(Math.round(userSettings.volumeSystem), Math.round(userSettings.volumeFurni), Math.round(userSettings.volumeTrax)));
                break;
        }
    };

    useMessageEvent<UserSettingsEvent>(UserSettingsEvent, event =>
    {
        const parser = event.getParser();
        const settingsEvent = new NitroSettingsEvent();

        settingsEvent.volumeSystem = parser.volumeSystem;
        settingsEvent.volumeFurni = parser.volumeFurni;
        settingsEvent.volumeTrax = parser.volumeTrax;
        settingsEvent.oldChat = parser.oldChat;
        settingsEvent.roomInvites = parser.roomInvites;
        settingsEvent.cameraFollow = parser.cameraFollow;
        settingsEvent.flags = parser.flags;
        settingsEvent.chatType = parser.chatType;
        settingsEvent.onlineStatusVisible = parser.onlineStatusVisible;
        settingsEvent.friendsCanFollow = parser.friendsCanFollow;
        settingsEvent.friendRequestsAllowed = parser.friendRequestsAllowed;

        setUserSettings(settingsEvent);
        DispatchMainEvent(settingsEvent);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setSection((parts[2] as SettingsSection) || null);
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setSection((parts[2] as SettingsSection) || null);
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'user-settings/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!userSettings) return;

        DispatchUiEvent(userSettings);
    }, [ userSettings ]);

    if(!isVisible || !userSettings) return null;

    const showChat = (section === null || section === 'chat');
    const showOther = (section === null || section === 'other');
    const showAudio = (section === null || section === 'audio');
    const showPrivacy = (section === 'privacy');
    const showAccountLink = (section === null);

    const headerText = (section === 'audio')
        ? localizeWithFallback('widget.memenu.settings.volume', 'Audio settings')
        : (section === 'chat')
            ? localizeWithFallback('room.chat.settings.title', 'Chat settings')
            : (section === 'other')
                ? localizeWithFallback('memenu.settings.other', 'Other settings')
                : (section === 'privacy')
                    ? localizeWithFallback('privacy.settings.title', 'Game Privacy')
                : LocalizeText('widget.memenu.settings.title');

    return (
        <NitroCardView className="user-settings-window min-w-0 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]" theme="primary-slim" uniqueKey="user-settings">
            <NitroCardHeaderView headerText={ headerText } onCloseClick={ event => processAction('close_view') } />
            <NitroCardContentView className="text-black">
                { showChat &&
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <input checked={ userSettings.oldChat } className="form-check-input" type="checkbox" onChange={ event => processAction('oldchat', event.target.checked) } />
                            <Text>{ LocalizeText('memenu.settings.chat.prefer.old.chat') }</Text>
                        </div>
                        <div className="flex items-center gap-1">
                            <input checked={ chatWindowEnabled } className="form-check-input" type="checkbox" onChange={ event => setChatWindowEnabled(event.target.checked) } />
                            <Text>{ LocalizeText('memenu.settings.other.enable.chat.window') }</Text>
                        </div>
                    </div> }
                { showOther &&
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <input checked={ userSettings.roomInvites } className="form-check-input" type="checkbox" onChange={ event => processAction('room_invites', event.target.checked) } />
                            <Text>{ LocalizeText('memenu.settings.other.ignore.room.invites') }</Text>
                        </div>
                        <div className="flex items-center gap-1">
                            <input checked={ userSettings.cameraFollow } className="form-check-input" type="checkbox" onChange={ event => processAction('camera_follow', event.target.checked) } />
                            <Text>{ LocalizeText('memenu.settings.other.disable.room.camera.follow') }</Text>
                        </div>
                        <div className="flex items-center gap-1">
                            <input checked={ catalogPlaceMultipleObjects } className="form-check-input" type="checkbox" onChange={ event => setCatalogPlaceMultipleObjects(event.target.checked) } />
                            <Text>{ LocalizeText('memenu.settings.other.place.multiple.objects') }</Text>
                        </div>
                        <div className="flex items-center gap-1">
                            <input checked={ catalogSkipPurchaseConfirmation } className="form-check-input" type="checkbox" onChange={ event => setCatalogSkipPurchaseConfirmation(event.target.checked) } />
                            <Text>{ LocalizeText('memenu.settings.other.skip.purchase.confirmation') }</Text>
                        </div>
                    </div> }
                { showPrivacy &&
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <Text bold>{ localizeWithFallback('privacy.settings.online.title', 'Online status') }</Text>
                            <Text>{ localizeWithFallback('settings.privacy.online_status_description', 'Who can see your online status:') }</Text>
                            <label className="flex items-center gap-1">
                                <input checked={ userSettings.onlineStatusVisible } className="form-check-input" name="online-status-visibility" type="radio" onChange={ () => processAction('online_status_visible', true) } />
                                <Text>{ localizeWithFallback('settings.privacy.everyone', 'Everyone') }</Text>
                            </label>
                            <label className="flex items-center gap-1">
                                <input checked={ !userSettings.onlineStatusVisible } className="form-check-input" name="online-status-visibility" type="radio" onChange={ () => processAction('online_status_visible', false) } />
                                <Text>{ localizeWithFallback('settings.privacy.noone', 'Nobody') }</Text>
                            </label>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text bold>{ localizeWithFallback('privacy.settings.follow.title', 'Follow settings') }</Text>
                            <label className="flex items-center gap-1">
                                <input checked={ userSettings.friendsCanFollow } className="form-check-input" type="checkbox" onChange={ event => processAction('friends_can_follow', event.target.checked) } />
                                <Text>{ localizeWithFallback('settings.privacy.follow_description', 'My friends can follow me from one room to another') }</Text>
                            </label>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text bold>{ localizeWithFallback('privacy.settings.friend_requests.title', 'Friend requests') }</Text>
                            <label className="flex items-center gap-1">
                                <input checked={ userSettings.friendRequestsAllowed } className="form-check-input" type="checkbox" onChange={ event => processAction('friend_requests_allowed', event.target.checked) } />
                                <Text>{ localizeWithFallback('settings.privacy.friend_requests_description', 'Other Habbos can send me a friend request') }</Text>
                            </label>
                        </div>
                    </div> }
                { showAudio &&
                    <div className="flex flex-col">
                        <Text bold>{ LocalizeText('widget.memenu.settings.volume') }</Text>
                        <div className="flex flex-col gap-1">
                            <Text>{ LocalizeText('widget.memenu.settings.volume.ui') }</Text>
                            <div className="flex items-center gap-1">
                                { (userSettings.volumeSystem === 0) && <FaVolumeMute className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                                { (userSettings.volumeSystem > 0) && <FaVolumeDown className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                                <input className="custom-range w-full" id="volumeSystem" max="100" min="0" step="1" type="range" value={ userSettings.volumeSystem } onChange={ event => processAction('system_volume', event.target.value) } onMouseUp={ () => saveRangeSlider('volume') } />
                                <FaVolumeUp className={ classNames((userSettings.volumeSystem < 50) && 'text-muted', 'fa-icon') } />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text>{ LocalizeText('widget.memenu.settings.volume.furni') }</Text>
                            <div className="flex items-center gap-1">
                                { (userSettings.volumeFurni === 0) && <FaVolumeMute className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                                { (userSettings.volumeFurni > 0) && <FaVolumeDown className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                                <input className="custom-range w-full" id="volumeFurni" max="100" min="0" step="1" type="range" value={ userSettings.volumeFurni } onChange={ event => processAction('furni_volume', event.target.value) } onMouseUp={ () => saveRangeSlider('volume') } />
                                <FaVolumeUp className={ classNames((userSettings.volumeFurni < 50) && 'text-muted', 'fa-icon') } />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text>{ LocalizeText('widget.memenu.settings.volume.trax') }</Text>
                            <div className="flex items-center gap-1">
                                { (userSettings.volumeTrax === 0) && <FaVolumeMute className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                                { (userSettings.volumeTrax > 0) && <FaVolumeDown className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                                <input className="custom-range w-full" id="volumeTrax" max="100" min="0" step="1" type="range" value={ userSettings.volumeTrax } onChange={ event => processAction('trax_volume', event.target.value) } onMouseUp={ () => saveRangeSlider('volume') } />
                                <FaVolumeUp className={ classNames((userSettings.volumeTrax < 50) && 'text-muted', 'fa-icon') } />
                            </div>
                        </div>
                    </div> }
                { showAccountLink &&
                    <div className="flex flex-col pt-2 mt-1 border-t border-black/10">
                        <button
                            type="button"
                            onClick={ () => CreateLinkEvent('user-account-settings/show') }
                            className="group flex items-center gap-2 rounded-md border border-black/10 bg-white px-2 py-1.5 hover:bg-[#f5fbfd] hover:border-[#418db0] transition-colors cursor-pointer text-left">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#418db0] text-white shadow-[inset_0_2px_#ffffff26,inset_0_-2px_#0000001a]">
                                <FaUserCog size={ 12 } />
                            </div>
                            <div className="flex flex-col flex-1 leading-tight">
                                <Text bold>{ localizeWithFallback('usersettings.open.title', "User Settings") }</Text>
                                <Text small className="text-black/60">{ localizeWithFallback('usersettings.open.subtitle', "Password and account") }</Text>
                            </div>
                            <span className="text-black/30 group-hover:text-[#418db0] text-[10px]">›</span>
                        </button>
                    </div> }
                { (section !== null) &&
                    <div className="flex pt-2 mt-1 border-t border-black/10">
                        <Button variant="secondary" onClick={ event => processAction('close_view') }>{ localizeWithFallback('generic.back', 'Indietro') }</Button>
                    </div> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
