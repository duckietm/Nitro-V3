import { WiredActionLayoutCode } from '../../../../api';
import { WiredActionBotChangeFigureView } from './WiredActionBotChangeFigureView';
import { WiredActionFreezeView } from './WiredActionFreezeView';
import { WiredActionFurniToFurniView } from './WiredActionFurniToFurniView';
import { WiredActionSendSignalView } from './WiredActionSendSignalView';
import { WiredActionFurniAreaView } from '../selectors/WiredActionFurniAreaView';
import { WiredSelectorFurniNeighborhoodView } from '../selectors/WiredSelectorFurniNeighborhoodView';
import { WiredSelectorFurniByTypeView } from '../selectors/WiredSelectorFurniByTypeView';
import { WiredSelectorUsersAreaView } from '../selectors/WiredSelectorUsersAreaView';
import { WiredSelectorUsersNeighborhoodView } from '../selectors/WiredSelectorUsersNeighborhoodView';
import { WiredActionBotFollowAvatarView } from './WiredActionBotFollowAvatarView';
import { WiredActionBotGiveHandItemView } from './WiredActionBotGiveHandItemView';
import { WiredActionBotMoveView } from './WiredActionBotMoveView';
import { WiredActionBotTalkToAvatarView } from './WiredActionBotTalkToAvatarView';
import { WiredActionBotTalkView } from './WiredActionBotTalkView';
import { WiredActionBotTeleportView } from './WiredActionBotTeleportView';
import { WiredActionCallAnotherStackView } from './WiredActionCallAnotherStackView';
import { WiredActionChaseView } from './WiredActionChaseView';
import { WiredActionChatView } from './WiredActionChatView';
import { WiredActionFleeView } from './WiredActionFleeView';
import { WiredActionGiveRewardView } from './WiredActionGiveRewardView';
import { WiredActionGiveScoreToPredefinedTeamView } from './WiredActionGiveScoreToPredefinedTeamView';
import { WiredActionGiveScoreView } from './WiredActionGiveScoreView';
import { WiredActionJoinTeamView } from './WiredActionJoinTeamView';
import { WiredActionKickFromRoomView } from './WiredActionKickFromRoomView';
import { WiredActionLeaveTeamView } from './WiredActionLeaveTeamView';
import { WiredActionMoveAndRotateFurniView } from './WiredActionMoveAndRotateFurniView';
import { WiredActionMoveFurniToView } from './WiredActionMoveFurniToView';
import { WiredActionMoveFurniView } from './WiredActionMoveFurniView';
import { WiredActionMuteUserView } from './WiredActionMuteUserView';
import { WiredActionRelativeMoveView } from './WiredActionRelativeMoveView';
import { WiredActionResetView } from './WiredActionResetView';
import { WiredActionSetFurniStateToView } from './WiredActionSetFurniStateToView';
import { WiredActionTeleportView } from './WiredActionTeleportView';
import { WiredActionToggleFurniStateView } from './WiredActionToggleFurniStateView';
import { WiredActionUnfreezeView } from './WiredActionUnfreezeView';

export const WiredActionLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredActionLayoutCode.BOT_CHANGE_FIGURE:
            return <WiredActionBotChangeFigureView />;
        case WiredActionLayoutCode.BOT_FOLLOW_AVATAR:
            return <WiredActionBotFollowAvatarView />;
        case WiredActionLayoutCode.BOT_GIVE_HAND_ITEM:
            return <WiredActionBotGiveHandItemView />;
        case WiredActionLayoutCode.BOT_MOVE:
            return <WiredActionBotMoveView />;
        case WiredActionLayoutCode.BOT_TALK:
            return <WiredActionBotTalkView />;
        case WiredActionLayoutCode.BOT_TALK_DIRECT_TO_AVTR:
            return <WiredActionBotTalkToAvatarView />;
        case WiredActionLayoutCode.BOT_TELEPORT:
            return <WiredActionBotTeleportView />;
        case WiredActionLayoutCode.CALL_ANOTHER_STACK:
            return <WiredActionCallAnotherStackView />;
        case WiredActionLayoutCode.CHASE:
            return <WiredActionChaseView />;
        case WiredActionLayoutCode.CHAT:
            return <WiredActionChatView />;
        case WiredActionLayoutCode.FLEE:
            return <WiredActionFleeView />;
        case WiredActionLayoutCode.FREEZE:
            return <WiredActionFreezeView />;
        case WiredActionLayoutCode.FURNI_TO_USER:
            return <WiredActionTeleportView />;
        case WiredActionLayoutCode.FURNI_TO_FURNI:
            return <WiredActionFurniToFurniView />;
        case WiredActionLayoutCode.GIVE_REWARD:
            return <WiredActionGiveRewardView />;
        case WiredActionLayoutCode.GIVE_SCORE:
            return <WiredActionGiveScoreView />;
        case WiredActionLayoutCode.GIVE_SCORE_TO_PREDEFINED_TEAM:
            return <WiredActionGiveScoreToPredefinedTeamView />;
        case WiredActionLayoutCode.JOIN_TEAM:
            return <WiredActionJoinTeamView />;
        case WiredActionLayoutCode.KICK_FROM_ROOM:
            return <WiredActionKickFromRoomView />;
        case WiredActionLayoutCode.LEAVE_TEAM:
            return <WiredActionLeaveTeamView />;
        case WiredActionLayoutCode.MOVE_FURNI:
            return <WiredActionMoveFurniView />;
        case WiredActionLayoutCode.MOVE_AND_ROTATE_FURNI:
            return <WiredActionMoveAndRotateFurniView />;
        case WiredActionLayoutCode.MOVE_FURNI_TO:
            return <WiredActionMoveFurniToView />;
        case WiredActionLayoutCode.MUTE_USER:
            return <WiredActionMuteUserView />;
        case WiredActionLayoutCode.RELATIVE_MOVE:
            return <WiredActionRelativeMoveView />;
        case WiredActionLayoutCode.RESET:
            return <WiredActionResetView />;
        case WiredActionLayoutCode.SET_FURNI_STATE:
            return <WiredActionSetFurniStateToView />;
        case WiredActionLayoutCode.TELEPORT:
            return <WiredActionTeleportView />;
        case WiredActionLayoutCode.TOGGLE_FURNI_STATE:
            return <WiredActionToggleFurniStateView />;
        case WiredActionLayoutCode.UNFREEZE:
            return <WiredActionUnfreezeView />;
        case WiredActionLayoutCode.USER_TO_FURNI:
            return <WiredActionTeleportView />;
        case WiredActionLayoutCode.FURNI_AREA_SELECTOR:
            return <WiredActionFurniAreaView />;
        case WiredActionLayoutCode.FURNI_NEIGHBORHOOD_SELECTOR:
            return <WiredSelectorFurniNeighborhoodView />;
        case WiredActionLayoutCode.FURNI_BYTYPE_SELECTOR:
            return <WiredSelectorFurniByTypeView />;
        case WiredActionLayoutCode.USERS_AREA_SELECTOR:
            return <WiredSelectorUsersAreaView />;
        case WiredActionLayoutCode.USERS_NEIGHBORHOOD_SELECTOR:
            return <WiredSelectorUsersNeighborhoodView />;
        case WiredActionLayoutCode.SEND_SIGNAL:
            return <WiredActionSendSignalView />;
    }

    return null;
};
