import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './common';

import './css/index.css';

import './css/backgrounds/BackgroundsView.css';

import './css/chat/Chats.css';

import './css/common/Buttons.css';

import './css/forms/form_select.css';

import './css/friends/FriendsView.css';

import './css/hotelview/HotelView.css';

import './css/login/LoginView.css';

import './css/icons/icons.css';

import './css/layout/LayoutTrophy.css';

import './css/nitrocard/NitroCardView.css';

import './css/notification/NotificationCenterView.css';

import './css/purse/PurseView.css';

import './css/room/InfoStand.css';
import './css/room/NavigatorRoomSettings.css';
import './css/room/RoomWidgets.css';

import './css/slider.css';

import './css/toolbar/ToolBar.css';

import './css/widgets/FurnitureWidgets.css';

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
