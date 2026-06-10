import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { App } from './App';
import { LoadingView } from './components/loading/LoadingView';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});

import './css/index.css';

import './css/backgrounds/BackgroundsView.css';
import './css/badges/BadgeLeaderboardView.css';
import './css/catalog/CatalogClassicView.css';
import './css/emustats/EmuStatsView.css';

import './css/chat/Chats.css';
import './css/chat/ChatInputMentionSelectorView.css';
import './css/mentions/MentionToasts.css';
import './css/mentions/MentionsPanel.css';

import './css/common/Buttons.css';
import './css/common/ClassicScrollbar.css';


import './css/forms/form_select.css';

import './css/friends/FriendsView.css';

import './css/habbo/HabboSwfSkin.css';

import './css/hotelview/HotelView.css';

import './css/login/LoginView.css';

import './css/icons/icons.css';

import './css/inventory/InventoryView.css';


import './css/layout/LayoutTrophy.css';


import './css/nitrocard/NitroCardView.css';

import './css/notification/NotificationCenterView.css';

import './css/purse/PurseView.css';

import './css/room/InfoStand.css';
import './css/room/NavigatorRoomSettings.css';
import './css/room/RoomWidgets.css';

import './css/slider.css';

import './css/toolbar/ToolBar.css';
import './css/user-profile/UserProfileView.css';

import './css/widgets/FurnitureWidgets.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <QueryClientProvider client={ queryClient }>
            <ErrorBoundary
                fallbackRender={ ({ error }) => (
                    <LoadingView
                        isError={ true }
                        message={ `Something went wrong.\n${ (error as Error)?.message ?? 'Unknown error' }` }
                        homeUrl={ window.location.origin + '/' } />
                ) }>
                <Suspense fallback={ <LoadingView message="Loading…" /> }>
                    <App />
                </Suspense>
            </ErrorBoundary>
        </QueryClientProvider>
    </StrictMode>
);
