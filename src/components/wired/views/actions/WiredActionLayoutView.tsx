import { WiredActionLayoutCode } from '../../../../api';
import { WiredActionBotChangeFigureView } from './WiredActionBotChangeFigureView';
import { WiredActionAdjustClockView } from './WiredActionAdjustClockView';
import { WiredActionFreezeView } from './WiredActionFreezeView';
import { WiredActionControlClockView } from './WiredActionControlClockView';
import { WiredActionFurniToFurniView } from './WiredActionFurniToFurniView';
import { WiredActionSetAltitudeView } from './WiredActionSetAltitudeView';
import { WiredActionSendSignalView } from './WiredActionSendSignalView';
import { WiredActionFurniAreaView } from '../selectors/WiredActionFurniAreaView';
import { WiredSelectorFurniNeighborhoodView } from '../selectors/WiredSelectorFurniNeighborhoodView';
import { WiredSelectorFurniByTypeView } from '../selectors/WiredSelectorFurniByTypeView';
import { WiredSelectorFurniAltitudeView } from '../selectors/WiredSelectorFurniAltitudeView';
import { WiredSelectorFurniOnFurniView } from '../selectors/WiredSelectorFurniOnFurniView';
import { WiredSelectorFurniPicksView } from '../selectors/WiredSelectorFurniPicksView';
import { WiredSelectorFurniSignalView } from '../selectors/WiredSelectorFurniSignalView';
import { WiredSelectorUsersAreaView } from '../selectors/WiredSelectorUsersAreaView';
import { WiredSelectorUsersByTypeView } from '../selectors/WiredSelectorUsersByTypeView';
import { WiredSelectorUsersByActionView } from '../selectors/WiredSelectorUsersByActionView';
import { WiredSelectorUsersByNameView } from '../selectors/WiredSelectorUsersByNameView';
import { WiredSelectorUsersOnFurniView } from '../selectors/WiredSelectorUsersOnFurniView';
import { WiredSelectorUsersGroupView } from '../selectors/WiredSelectorUsersGroupView';
import { WiredSelectorUsersHandItemView } from '../selectors/WiredSelectorUsersHandItemView';
import { WiredSelectorUsersNeighborhoodView } from '../selectors/WiredSelectorUsersNeighborhoodView';
import { WiredSelectorUsersSignalView } from '../selectors/WiredSelectorUsersSignalView';
import { WiredSelectorUsersTeamView } from '../selectors/WiredSelectorUsersTeamView';
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
import { WiredActionMoveRotateUserView } from './WiredActionMoveRotateUserView';
import { WiredActionMoveFurniToView } from './WiredActionMoveFurniToView';
import { WiredActionMoveFurniView } from './WiredActionMoveFurniView';
import { WiredActionMuteUserView } from './WiredActionMuteUserView';
import { WiredActionRelativeMoveView } from './WiredActionRelativeMoveView';
import { WiredActionResetView } from './WiredActionResetView';
import { WiredActionSetFurniStateToView } from './WiredActionSetFurniStateToView';
import { WiredActionTeleportView } from './WiredActionTeleportView';
import { WiredActionToggleFurniStateView } from './WiredActionToggleFurniStateView';
import { WiredActionUnfreezeView } from './WiredActionUnfreezeView';
import { WiredExtraFilterFurniView } from '../extras/WiredExtraFilterFurniView';
import { WiredExtraFilterUserView } from '../extras/WiredExtraFilterUserView';
import { WiredExtraAnimationTimeView } from '../extras/WiredExtraAnimationTimeView';
import { WiredExtraMoveCarryUsersView } from '../extras/WiredExtraMoveCarryUsersView';
import { WiredExtraExecuteInOrderView } from '../extras/WiredExtraExecuteInOrderView';
import { WiredExtraExecutionLimitView } from '../extras/WiredExtraExecutionLimitView';
import { WiredExtraMoveNoAnimationView } from '../extras/WiredExtraMoveNoAnimationView';
import { WiredExtraOrEvalView } from '../extras/WiredExtraOrEvalView';
import { WiredExtraMovePhysicsView } from '../extras/WiredExtraMovePhysicsView';
import { WiredExtraRandomView } from '../extras/WiredExtraRandomView';
import { WiredExtraTextOutputFurniNameView } from '../extras/WiredExtraTextOutputFurniNameView';
import { WiredExtraTextOutputUsernameView } from '../extras/WiredExtraTextOutputUsernameView';
import { WiredExtraUnseenView } from '../extras/WiredExtraUnseenView';

export const WiredActionLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredActionLayoutCode.BOT_CHANGE_FIGURE:
            return <WiredActionBotChangeFigureView />;
        case WiredActionLayoutCode.ADJUST_CLOCK:
            return <WiredActionAdjustClockView />;
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
        case WiredActionLayoutCode.CONTROL_CLOCK:
            return <WiredActionControlClockView />;
        case WiredActionLayoutCode.FURNI_TO_USER:
            return <WiredActionTeleportView />;
        case WiredActionLayoutCode.FURNI_TO_FURNI:
            return <WiredActionFurniToFurniView />;
        case WiredActionLayoutCode.SET_ALTITUDE:
            return <WiredActionSetAltitudeView />;
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
        case WiredActionLayoutCode.MOVE_ROTATE_USER:
            return <WiredActionMoveRotateUserView />;
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
        case WiredActionLayoutCode.FURNI_ALTITUDE_SELECTOR:
            return <WiredSelectorFurniAltitudeView />;
        case WiredActionLayoutCode.FURNI_ON_FURNI_SELECTOR:
            return <WiredSelectorFurniOnFurniView />;
        case WiredActionLayoutCode.FURNI_PICKS_SELECTOR:
            return <WiredSelectorFurniPicksView />;
        case WiredActionLayoutCode.FURNI_SIGNAL_SELECTOR:
            return <WiredSelectorFurniSignalView />;
        case WiredActionLayoutCode.USERS_AREA_SELECTOR:
            return <WiredSelectorUsersAreaView />;
        case WiredActionLayoutCode.USERS_NEIGHBORHOOD_SELECTOR:
            return <WiredSelectorUsersNeighborhoodView />;
        case WiredActionLayoutCode.USERS_SIGNAL_SELECTOR:
            return <WiredSelectorUsersSignalView />;
        case WiredActionLayoutCode.USERS_BY_TYPE_SELECTOR:
            return <WiredSelectorUsersByTypeView />;
        case WiredActionLayoutCode.USERS_BY_ACTION_SELECTOR:
            return <WiredSelectorUsersByActionView />;
        case WiredActionLayoutCode.USERS_BY_NAME_SELECTOR:
            return <WiredSelectorUsersByNameView />;
        case WiredActionLayoutCode.USERS_ON_FURNI_SELECTOR:
            return <WiredSelectorUsersOnFurniView />;
        case WiredActionLayoutCode.USERS_GROUP_SELECTOR:
            return <WiredSelectorUsersGroupView />;
        case WiredActionLayoutCode.USERS_HANDITEM_SELECTOR:
            return <WiredSelectorUsersHandItemView />;
        case WiredActionLayoutCode.USERS_TEAM_SELECTOR:
            return <WiredSelectorUsersTeamView />;
        case WiredActionLayoutCode.FILTER_FURNI_EXTRA:
            return <WiredExtraFilterFurniView />;
        case WiredActionLayoutCode.FILTER_USER_EXTRA:
            return <WiredExtraFilterUserView />;
        case WiredActionLayoutCode.MOVE_CARRY_USERS_EXTRA:
            return <WiredExtraMoveCarryUsersView />;
        case WiredActionLayoutCode.MOVE_NO_ANIMATION_EXTRA:
            return <WiredExtraMoveNoAnimationView />;
        case WiredActionLayoutCode.ANIMATION_TIME_EXTRA:
            return <WiredExtraAnimationTimeView />;
        case WiredActionLayoutCode.MOVE_PHYSICS_EXTRA:
            return <WiredExtraMovePhysicsView />;
        case WiredActionLayoutCode.UNSEEN_EXTRA:
            return <WiredExtraUnseenView />;
        case WiredActionLayoutCode.RANDOM_EXTRA:
            return <WiredExtraRandomView />;
        case WiredActionLayoutCode.EXEC_IN_ORDER_EXTRA:
            return <WiredExtraExecuteInOrderView />;
        case WiredActionLayoutCode.EXECUTION_LIMIT_EXTRA:
            return <WiredExtraExecutionLimitView />;
        case WiredActionLayoutCode.OR_EVAL_EXTRA:
            return <WiredExtraOrEvalView />;
        case WiredActionLayoutCode.TEXT_OUTPUT_USERNAME_EXTRA:
            return <WiredExtraTextOutputUsernameView />;
        case WiredActionLayoutCode.TEXT_OUTPUT_FURNI_NAME_EXTRA:
            return <WiredExtraTextOutputFurniNameView />;
        case WiredActionLayoutCode.SEND_SIGNAL:
            return <WiredActionSendSignalView />;
    }

    return null;
};
