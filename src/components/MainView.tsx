import { AddLinkEventTracker, GetCommunication, GetRoomSessionManager, HabboWebTools, ILinkEventTracker, MarkMentionsReadComposer, RemoveLinkEventTracker, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue, SendMessageComposer } from '../api';
import { useMentionMessages, useNitroEventReducer } from '../hooks';
import { markAllRead } from '../hooks/mentions/mentionsStore';
import { AchievementsView } from './achievements/AchievementsView';
import { AvatarEditorView } from './avatar-editor';
import { BadgeCreatorView } from './badge-creator';
import { BadgeLeaderboardView } from './badge-leaderboard/BadgeLeaderboardView';
import { AvatarEffectsView } from './avatar-effects';
import { CameraWidgetView } from './camera/CameraWidgetView';
import { CampaignView } from './campaign/CampaignView';
import { CatalogView } from './catalog/CatalogView';
import { ChatHistoryView } from './chat-history/ChatHistoryView';
import { CustomizeNickIconView } from './customize/CustomizeNickIconView';
import { EmuStatsView } from './emustats/EmuStatsView';
import { FloorplanEditorView } from './floorplan-editor/FloorplanEditorView';
import { FurniEditorView } from './furni-editor/FurniEditorView';
import { FriendsView } from './friends/FriendsView';
import { GameCenterView } from './game-center/GameCenterView';
import { GroupsView } from './groups/GroupsView';
import { GroupForumView } from './groups/views/forums/GroupForumView';
import { GuideToolView } from './guide-tool/GuideToolView';
import { HcCenterView } from './hc-center/HcCenterView';
import { HelpView } from './help/HelpView';
import { HotelView } from './hotel-view/HotelView';
import { HousekeepingView } from './housekeeping/HousekeepingView';
import { RareValuesView } from './rare-values/RareValuesView';
import { FortuneWheelView } from './fortune-wheel/FortuneWheelView';
import { SoundboardView } from './soundboard/SoundboardView';
import { RadioView } from './radio/RadioView';
import { InventoryView } from './inventory/InventoryView';
import { ModToolsView } from './mod-tools/ModToolsView';
import { NavigatorView } from './navigator/NavigatorView';
import { NitrobubbleHiddenView } from './nitrobubblehidden/NitrobubbleHiddenView';
import { NitropediaView } from './nitropedia/NitropediaView';
import { ExternalPluginLoader } from './plugins/ExternalPluginLoader';
import { GoogleAdsView } from './ads/GoogleAdsView';
import { RightSideView } from './right-side/RightSideView';
import { RoomView } from './room/RoomView';
import { ToolbarView } from './toolbar/ToolbarView';
import { TranslationBootstrap } from './translation/TranslationBootstrap';
import { TranslationSettingsView } from './translation/TranslationSettingsView';
import { UserProfileView } from './user-profile/UserProfileView';
import { UserAccountSettingsView } from './user-settings/UserAccountSettingsView';
import { UserSettingsView } from './user-settings/UserSettingsView';
import { VaultView } from './vault/VaultView';
import { WiredView } from './wired/WiredView';
import { WiredCreatorToolsView } from './wired-tools/WiredCreatorToolsView';
import { MentionsView } from './mentions';

export const MainView: FC<{}> = props =>
{
    const [ isReady, setIsReady ] = useState(false);
    const [ localizationVersion, setLocalizationVersion ] = useState(0);
    const [ mentionsVisible, setMentionsVisible ] = useState(false);

    useMentionMessages();

    // CREATED and ENDED can arrive out of order under flaky reconnects.
    // Treating them as two independent setters left landingViewVisible
    // contradicting the actual session state (stuck open in-room or
    // stuck closed at the hotel view). The reducer carries the active
    // session's roomId so a stale ENDED for a previous session is
    // ignored — only an ENDED matching the tracked session (or when
    // no session is active) is honored.
    const { landingViewVisible } = useNitroEventReducer<{ sessionId: number | null; landingViewVisible: boolean }, RoomSessionEvent>(
        [ RoomSessionEvent.CREATED, RoomSessionEvent.ENDED ],
        (state, event) =>
        {
            if(event.type === RoomSessionEvent.CREATED)
            {
                return { sessionId: event.session.roomId, landingViewVisible: false };
            }

            if((state.sessionId !== null) && (event.session.roomId !== state.sessionId))
            {
                return state;
            }

            return { sessionId: null, landingViewVisible: event.openLandingView };
        },
        { sessionId: null, landingViewVisible: true }
    );

    useEffect(() =>
    {
        setIsReady(true);

        GetRoomSessionManager().tryRestoreSession();

        GetCommunication().connection.ready();
    }, []);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'open':
                        if(parts.length > 2)
                        {
                            switch(parts[2])
                            {
                                case 'credits':
                                    //HabboWebTools.openWebPageAndMinimizeClient(this._windowManager.getProperty(ExternalVariables.WEB_SHOP_RELATIVE_URL));
                                    break;
                                default: {
                                    const name = parts[2];
                                    HabboWebTools.openHabblet(name);
                                }
                            }
                        }
                        return;
                }
            },
            eventUrlPrefix: 'habblet/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        // Opening the inbox clears the unread badge both locally and
        // server-side so the toolbar count resets immediately.
        const clearMentionsBadge = () =>
        {
            markAllRead();
            SendMessageComposer(new MarkMentionsReadComposer(0, 0));
        };

        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setMentionsVisible(true);
                        clearMentionsBadge();
                        return;
                    case 'hide':
                        setMentionsVisible(false);
                        return;
                    case 'toggle':
                        setMentionsVisible(prevValue =>
                        {
                            if(prevValue) return false;

                            // Side-effect-free in the updater: defer the
                            // badge-clear to a microtask so React's
                            // double-invoke (StrictMode) can't fire it twice.
                            queueMicrotask(clearMentionsBadge);
                            return true;
                        });
                        return;
                }
            },
            eventUrlPrefix: 'mentions/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        const refreshLocalization = () => setLocalizationVersion(value => (value + 1));

        window.addEventListener('nitro-localization-updated', refreshLocalization);

        return () => window.removeEventListener('nitro-localization-updated', refreshLocalization);
    }, []);

    return (
        <>
            <div className="hidden" data-localization-version={ localizationVersion } />
            <AnimatePresence>
                { landingViewVisible &&
                    <motion.div
                        initial={ { opacity: 0 }}
                        animate={ { opacity: 1 }}
                        exit={ { opacity: 0 }}>
                        <HotelView />
                    </motion.div> }
            </AnimatePresence>
            <ToolbarView isInRoom={ !landingViewVisible } />
            <TranslationBootstrap />
            <GoogleAdsView />
            <ModToolsView />
            <HousekeepingView />
            <WiredCreatorToolsView />
            <RoomView />
            <ChatHistoryView />
            <CustomizeNickIconView />
            <WiredView />
            <AvatarEditorView />
            <BadgeCreatorView />
            <BadgeLeaderboardView />
            <EmuStatsView />
            <AvatarEffectsView />
            <AchievementsView />
            <NavigatorView />
            <NitrobubbleHiddenView />
            <InventoryView />
            <CatalogView />
            <FriendsView />
            <RightSideView />
            <UserSettingsView />
            <UserAccountSettingsView />
            <VaultView />
            <TranslationSettingsView />
            <UserProfileView />
            <GroupsView />
            <GroupForumView />
            <CameraWidgetView />
            <HelpView />
            <NitropediaView />
            <GuideToolView />
            <HcCenterView />
            <CampaignView />
            <GameCenterView />
            <FloorplanEditorView />
            <FurniEditorView />
            <RareValuesView />
            <FortuneWheelView />
            <SoundboardView />
            { GetConfigurationValue<boolean>('radio_ui.enabled', false) && <RadioView /> }
            { (GetConfigurationValue<boolean>('mentions_ui.enabled', true) && mentionsVisible) &&
                <MentionsView onClose={ () => setMentionsVisible(false) } /> }
            <ExternalPluginLoader />
        </>
    );
};
