import { AddLinkEventTracker, GetCommunication, GetRoomSessionManager, HabboWebTools, ILinkEventTracker, RemoveLinkEventTracker, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useEffect, useState } from 'react';
import { useNitroEvent } from '../hooks';
import { AchievementsView } from './achievements/AchievementsView';
import { AvatarEditorView } from './avatar-editor';
import { BadgeCreatorView } from './badge-creator';
import { AvatarEffectsView } from './avatar-effects';
import { CameraWidgetView } from './camera/CameraWidgetView';
import { CampaignView } from './campaign/CampaignView';
import { CatalogView } from './catalog/CatalogView';
import { ChatHistoryView } from './chat-history/ChatHistoryView';
import { CustomizeNickIconView } from './customize/CustomizeNickIconView';
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
import { WiredView } from './wired/WiredView';
import { WiredCreatorToolsView } from './wired-tools/WiredCreatorToolsView';

export const MainView: FC<{}> = props =>
{
    const [ isReady, setIsReady ] = useState(false);
    const [ landingViewVisible, setLandingViewVisible ] = useState(true);
    const [ localizationVersion, setLocalizationVersion ] = useState(0);

    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event => setLandingViewVisible(false));
    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, event => setLandingViewVisible(event.openLandingView));

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
            <WiredCreatorToolsView />
            <RoomView />
            <ChatHistoryView />
            <CustomizeNickIconView />
            <WiredView />
            <AvatarEditorView />
            <BadgeCreatorView />
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
            <ExternalPluginLoader />
        </>
    );
};
