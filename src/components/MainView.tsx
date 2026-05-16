import {
    AddLinkEventTracker,
    GetCommunication,
    GetRoomSessionManager,
    HabboWebTools,
    ILinkEventTracker,
    RemoveLinkEventTracker,
    RoomSessionEvent,
} from '@nitrots/nitro-renderer';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, Suspense, lazy, useEffect, useState } from 'react';
import { useNitroEvent } from '../hooks';
import { ErrorBoundary } from '../common';

const AchievementsView = lazy(() => import('./achievements/AchievementsView').then(m => ({ default: m.AchievementsView })));
const GoogleAdsView = lazy(() => import('./ads/GoogleAdsView').then(m => ({ default: m.GoogleAdsView })));
const AvatarEditorView = lazy(() => import('./avatar-editor').then(m => ({ default: m.AvatarEditorView })));
const AvatarEffectsView = lazy(() => import('./avatar-effects').then(m => ({ default: m.AvatarEffectsView })));
const BadgeCreatorView = lazy(() => import('./badge-creator').then(m => ({ default: m.BadgeCreatorView })));
const CameraWidgetView = lazy(() => import('./camera/CameraWidgetView').then(m => ({ default: m.CameraWidgetView })));
const CampaignView = lazy(() => import('./campaign/CampaignView').then(m => ({ default: m.CampaignView })));
const CatalogView = lazy(() => import('./catalog/CatalogView').then(m => ({ default: m.CatalogView })));
const ChatHistoryView = lazy(() => import('./chat-history/ChatHistoryView').then(m => ({ default: m.ChatHistoryView })));
const CustomizeNickIconView = lazy(() => import('./customize/CustomizeNickIconView').then(m => ({ default: m.CustomizeNickIconView })));
const FloorplanEditorView = lazy(() => import('./floorplan-editor/FloorplanEditorView').then(m => ({ default: m.FloorplanEditorView })));
const FriendsView = lazy(() => import('./friends/FriendsView').then(m => ({ default: m.FriendsView })));
const FurniEditorView = lazy(() => import('./furni-editor/FurniEditorView').then(m => ({ default: m.FurniEditorView })));
const GameCenterView = lazy(() => import('./game-center/GameCenterView').then(m => ({ default: m.GameCenterView })));
const GroupsView = lazy(() => import('./groups/GroupsView').then(m => ({ default: m.GroupsView })));
const GroupForumView = lazy(() => import('./groups/views/forums/GroupForumView').then(m => ({ default: m.GroupForumView })));
const GuideToolView = lazy(() => import('./guide-tool/GuideToolView').then(m => ({ default: m.GuideToolView })));
const HcCenterView = lazy(() => import('./hc-center/HcCenterView').then(m => ({ default: m.HcCenterView })));
const HelpView = lazy(() => import('./help/HelpView').then(m => ({ default: m.HelpView })));
const HotelView = lazy(() => import('./hotel-view/HotelView').then(m => ({ default: m.HotelView })));
const InventoryView = lazy(() => import('./inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const ModToolsView = lazy(() => import('./mod-tools/ModToolsView').then(m => ({ default: m.ModToolsView })));
const NavigatorView = lazy(() => import('./navigator/NavigatorView').then(m => ({ default: m.NavigatorView })));
const NitrobubbleHiddenView = lazy(() => import('./nitrobubblehidden/NitrobubbleHiddenView').then(m => ({ default: m.NitrobubbleHiddenView })));
const NitropediaView = lazy(() => import('./nitropedia/NitropediaView').then(m => ({ default: m.NitropediaView })));
const ExternalPluginLoader = lazy(() => import('./plugins/ExternalPluginLoader').then(m => ({ default: m.ExternalPluginLoader })));
const RightSideView = lazy(() => import('./right-side/RightSideView').then(m => ({ default: m.RightSideView })));
const RoomView = lazy(() => import('./room/RoomView').then(m => ({ default: m.RoomView })));
const ToolbarView = lazy(() => import('./toolbar/ToolbarView').then(m => ({ default: m.ToolbarView })));
const TranslationBootstrap = lazy(() => import('./translation/TranslationBootstrap').then(m => ({ default: m.TranslationBootstrap })));
const TranslationSettingsView = lazy(() => import('./translation/TranslationSettingsView').then(m => ({ default: m.TranslationSettingsView })));
const UserProfileView = lazy(() => import('./user-profile/UserProfileView').then(m => ({ default: m.UserProfileView })));
const UserAccountSettingsView = lazy(() => import('./user-settings/UserAccountSettingsView').then(m => ({ default: m.UserAccountSettingsView })));
const UserSettingsView = lazy(() => import('./user-settings/UserSettingsView').then(m => ({ default: m.UserSettingsView })));
const WiredView = lazy(() => import('./wired/WiredView').then(m => ({ default: m.WiredView })));
const WiredCreatorToolsView = lazy(() => import('./wired-tools/WiredCreatorToolsView').then(m => ({ default: m.WiredCreatorToolsView })));

const LazyComponent: FC<{ children: React.ReactNode }> = ({ children }) => (
    <ErrorBoundary>
        <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#1c1c20' }} />}>{children}</Suspense>
    </ErrorBoundary>
);

export const MainView: FC<{}> = (_props) => {
    const [_isReady, setIsReady] = useState(false);
    const [landingViewVisible, setLandingViewVisible] = useState(true);
    const [localizationVersion, setLocalizationVersion] = useState(0);

    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, (_event) => setLandingViewVisible(false));
    useNitroEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, (event) => setLandingViewVisible(event.openLandingView));

    useEffect(() => {
        setIsReady(true);

        GetRoomSessionManager().tryRestoreSession();

        GetCommunication().connection.ready();
    }, []);

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'open':
                        if (parts.length > 2) {
                            switch (parts[2]) {
                                case 'credits':
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
            eventUrlPrefix: 'habblet/',
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() => {
        const refreshLocalization = () => setLocalizationVersion((value) => value + 1);

        window.addEventListener('nitro-localization-updated', refreshLocalization);

        return () => window.removeEventListener('nitro-localization-updated', refreshLocalization);
    }, []);

    return (
        <>
            <div className="hidden" data-localization-version={localizationVersion} />
            <AnimatePresence>
                {landingViewVisible && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <LazyComponent>
                            <HotelView />
                        </LazyComponent>
                    </motion.div>
                )}
            </AnimatePresence>
            <LazyComponent>
                <ToolbarView isInRoom={!landingViewVisible} />
            </LazyComponent>
            <LazyComponent>
                <TranslationBootstrap />
            </LazyComponent>
            <LazyComponent>
                <GoogleAdsView />
            </LazyComponent>
            <LazyComponent>
                <ModToolsView />
            </LazyComponent>
            <LazyComponent>
                <WiredCreatorToolsView />
            </LazyComponent>
            <LazyComponent>
                <RoomView />
            </LazyComponent>
            <LazyComponent>
                <ChatHistoryView />
            </LazyComponent>
            <LazyComponent>
                <CustomizeNickIconView />
            </LazyComponent>
            <LazyComponent>
                <WiredView />
            </LazyComponent>
            <LazyComponent>
                <AvatarEditorView />
            </LazyComponent>
            <LazyComponent>
                <BadgeCreatorView />
            </LazyComponent>
            <LazyComponent>
                <AvatarEffectsView />
            </LazyComponent>
            <LazyComponent>
                <AchievementsView />
            </LazyComponent>
            <LazyComponent>
                <NavigatorView />
            </LazyComponent>
            <LazyComponent>
                <NitrobubbleHiddenView />
            </LazyComponent>
            <LazyComponent>
                <InventoryView />
            </LazyComponent>
            <LazyComponent>
                <CatalogView />
            </LazyComponent>
            <LazyComponent>
                <FriendsView />
            </LazyComponent>
            <LazyComponent>
                <RightSideView />
            </LazyComponent>
            <LazyComponent>
                <UserSettingsView />
            </LazyComponent>
            <LazyComponent>
                <UserAccountSettingsView />
            </LazyComponent>
            <LazyComponent>
                <TranslationSettingsView />
            </LazyComponent>
            <LazyComponent>
                <UserProfileView />
            </LazyComponent>
            <LazyComponent>
                <GroupsView />
            </LazyComponent>
            <LazyComponent>
                <GroupForumView />
            </LazyComponent>
            <LazyComponent>
                <CameraWidgetView />
            </LazyComponent>
            <LazyComponent>
                <HelpView />
            </LazyComponent>
            <LazyComponent>
                <NitropediaView />
            </LazyComponent>
            <LazyComponent>
                <GuideToolView />
            </LazyComponent>
            <LazyComponent>
                <HcCenterView />
            </LazyComponent>
            <LazyComponent>
                <CampaignView />
            </LazyComponent>
            <LazyComponent>
                <GameCenterView />
            </LazyComponent>
            <LazyComponent>
                <FloorplanEditorView />
            </LazyComponent>
            <LazyComponent>
                <FurniEditorView />
            </LazyComponent>
            <LazyComponent>
                <ExternalPluginLoader />
            </LazyComponent>
        </>
    );
};
