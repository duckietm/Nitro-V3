import { WiredActionLayoutCode } from '../../../../api';
import { WiredExtraAnimationTimeView } from '../extras/WiredExtraAnimationTimeView';
import { WiredExtraContextVariableView } from '../extras/WiredExtraContextVariableView';
import { WiredExtraExecuteInOrderView } from '../extras/WiredExtraExecuteInOrderView';
import { WiredExtraExecutionLimitView } from '../extras/WiredExtraExecutionLimitView';
import { WiredExtraFilterFurniByVariableView } from '../extras/WiredExtraFilterFurniByVariableView';
import { WiredExtraFilterFurniView } from '../extras/WiredExtraFilterFurniView';
import { WiredExtraFilterUsersByVariableView } from '../extras/WiredExtraFilterUsersByVariableView';
import { WiredExtraFilterUserView } from '../extras/WiredExtraFilterUserView';
import { WiredExtraFurniVariableView } from '../extras/WiredExtraFurniVariableView';
import { WiredExtraMoveCarryUsersView } from '../extras/WiredExtraMoveCarryUsersView';
import { WiredExtraMoveNoAnimationView } from '../extras/WiredExtraMoveNoAnimationView';
import { WiredExtraMovePhysicsView } from '../extras/WiredExtraMovePhysicsView';
import { WiredExtraOrEvalView } from '../extras/WiredExtraOrEvalView';
import { WiredExtraRandomView } from '../extras/WiredExtraRandomView';
import { WiredExtraRoomVariableView } from '../extras/WiredExtraRoomVariableView';
import { WiredExtraTextInputVariableView } from '../extras/WiredExtraTextInputVariableView';
import { WiredExtraTextOutputFurniNameView } from '../extras/WiredExtraTextOutputFurniNameView';
import { WiredExtraTextOutputUsernameView } from '../extras/WiredExtraTextOutputUsernameView';
import { WiredExtraTextOutputVariableView } from '../extras/WiredExtraTextOutputVariableView';
import { WiredExtraUnseenView } from '../extras/WiredExtraUnseenView';
import { WiredExtraUserVariableView } from '../extras/WiredExtraUserVariableView';
import { WiredExtraVariableEchoView } from '../extras/WiredExtraVariableEchoView';
import { WiredExtraVariableLevelUpSystemView } from '../extras/WiredExtraVariableLevelUpSystemView';
import { WiredExtraVariableReferenceView } from '../extras/WiredExtraVariableReferenceView';
import { WiredExtraVariableTextConnectorView } from '../extras/WiredExtraVariableTextConnectorView';
import { WiredActionFurniAreaView } from '../selectors/WiredActionFurniAreaView';
import { WiredSelectorFurniAltitudeView } from '../selectors/WiredSelectorFurniAltitudeView';
import { WiredSelectorFurniByTypeView } from '../selectors/WiredSelectorFurniByTypeView';
import { WiredSelectorFurniNeighborhoodView } from '../selectors/WiredSelectorFurniNeighborhoodView';
import { WiredSelectorFurniOnFurniView } from '../selectors/WiredSelectorFurniOnFurniView';
import { WiredSelectorFurniPicksView } from '../selectors/WiredSelectorFurniPicksView';
import { WiredSelectorFurniSignalView } from '../selectors/WiredSelectorFurniSignalView';
import { WiredSelectorFurniWithVariableView } from '../selectors/WiredSelectorFurniWithVariableView';
import { WiredSelectorUsersAreaView } from '../selectors/WiredSelectorUsersAreaView';
import { WiredSelectorUsersByActionView } from '../selectors/WiredSelectorUsersByActionView';
import { WiredSelectorUsersByNameView } from '../selectors/WiredSelectorUsersByNameView';
import { WiredSelectorUsersByTypeView } from '../selectors/WiredSelectorUsersByTypeView';
import { WiredSelectorUsersGroupView } from '../selectors/WiredSelectorUsersGroupView';
import { WiredSelectorUsersHandItemView } from '../selectors/WiredSelectorUsersHandItemView';
import { WiredSelectorUsersNeighborhoodView } from '../selectors/WiredSelectorUsersNeighborhoodView';
import { WiredSelectorUsersOnFurniView } from '../selectors/WiredSelectorUsersOnFurniView';
import { WiredSelectorUsersSignalView } from '../selectors/WiredSelectorUsersSignalView';
import { WiredSelectorUsersTeamView } from '../selectors/WiredSelectorUsersTeamView';
import { WiredSelectorUsersWithVariableView } from '../selectors/WiredSelectorUsersWithVariableView';
import { WiredActionAdjustClockView } from './WiredActionAdjustClockView';
import { WiredActionBotChangeFigureView } from './WiredActionBotChangeFigureView';
import { WiredActionBotFollowAvatarView } from './WiredActionBotFollowAvatarView';
import { WiredActionBotGiveHandItemView } from './WiredActionBotGiveHandItemView';
import { WiredActionBotMoveView } from './WiredActionBotMoveView';
import { WiredActionBotTalkToAvatarView } from './WiredActionBotTalkToAvatarView';
import { WiredActionBotTalkView } from './WiredActionBotTalkView';
import { WiredActionBotTeleportView } from './WiredActionBotTeleportView';
import { WiredActionCallAnotherStackView } from './WiredActionCallAnotherStackView';
import { WiredActionChangeVariableValueView } from './WiredActionChangeVariableValueView';
import { WiredActionChaseView } from './WiredActionChaseView';
import { WiredActionChatView } from './WiredActionChatView';
import { WiredActionControlClockView } from './WiredActionControlClockView';
import { WiredActionFleeView } from './WiredActionFleeView';
import { WiredActionFreezeView } from './WiredActionFreezeView';
import { WiredActionFurniToFurniView } from './WiredActionFurniToFurniView';
import { WiredActionGiveRewardView } from './WiredActionGiveRewardView';
import { WiredActionGiveScoreToPredefinedTeamView } from './WiredActionGiveScoreToPredefinedTeamView';
import { WiredActionGiveScoreView } from './WiredActionGiveScoreView';
import { WiredActionGiveVariableView } from './WiredActionGiveVariableView';
import { WiredActionJoinTeamView } from './WiredActionJoinTeamView';
import { WiredActionKickFromRoomView } from './WiredActionKickFromRoomView';
import { WiredActionLeaveTeamView } from './WiredActionLeaveTeamView';
import { WiredActionMoveAndRotateFurniView } from './WiredActionMoveAndRotateFurniView';
import { WiredActionMoveFurniToView } from './WiredActionMoveFurniToView';
import { WiredActionMoveFurniView } from './WiredActionMoveFurniView';
import { WiredActionMoveRotateUserView } from './WiredActionMoveRotateUserView';
import { WiredActionMuteUserView } from './WiredActionMuteUserView';
import { WiredActionNegativeCallAnotherStackView } from './WiredActionNegativeCallAnotherStackView';
import { WiredActionRelativeMoveView } from './WiredActionRelativeMoveView';
import { WiredActionRemoveVariableView } from './WiredActionRemoveVariableView';
import { WiredActionResetView } from './WiredActionResetView';
import { WiredActionSendSignalView } from './WiredActionSendSignalView';
import { WiredActionSetAltitudeView } from './WiredActionSetAltitudeView';
import { WiredActionSetFurniStateToView } from './WiredActionSetFurniStateToView';
import { WiredActionTeleportView } from './WiredActionTeleportView';
import { WiredActionToggleFurniStateView } from './WiredActionToggleFurniStateView';
import { WiredActionUnfreezeView } from './WiredActionUnfreezeView';

export const WiredActionLayoutView = (code: number) => {
    switch (code) {
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
        case WiredActionLayoutCode.NEG_CALL_ANOTHER_STACK:
            return <WiredActionNegativeCallAnotherStackView />;
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
        case WiredActionLayoutCode.GIVE_VARIABLE:
            return <WiredActionGiveVariableView />;
        case WiredActionLayoutCode.CHANGE_VARIABLE_VALUE:
            return <WiredActionChangeVariableValueView />;
        case WiredActionLayoutCode.REMOVE_VARIABLE:
            return <WiredActionRemoveVariableView />;
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
        case WiredActionLayoutCode.FURNI_WITH_VARIABLE_SELECTOR:
            return <WiredSelectorFurniWithVariableView />;
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
        case WiredActionLayoutCode.USERS_WITH_VARIABLE_SELECTOR:
            return <WiredSelectorUsersWithVariableView />;
        case WiredActionLayoutCode.FILTER_FURNI_EXTRA:
            return <WiredExtraFilterFurniView />;
        case WiredActionLayoutCode.FILTER_USER_EXTRA:
            return <WiredExtraFilterUserView />;
        case WiredActionLayoutCode.FILTER_USERS_BY_VARIABLE_EXTRA:
            return <WiredExtraFilterUsersByVariableView />;
        case WiredActionLayoutCode.FILTER_FURNI_BY_VARIABLE_EXTRA:
            return <WiredExtraFilterFurniByVariableView />;
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
        case WiredActionLayoutCode.VARIABLE_TEXT_CONNECTOR_EXTRA:
            return <WiredExtraVariableTextConnectorView />;
        case WiredActionLayoutCode.TEXT_OUTPUT_VARIABLE_EXTRA:
            return <WiredExtraTextOutputVariableView />;
        case WiredActionLayoutCode.USER_VARIABLE_EXTRA:
            return <WiredExtraUserVariableView />;
        case WiredActionLayoutCode.FURNI_VARIABLE_EXTRA:
            return <WiredExtraFurniVariableView />;
        case WiredActionLayoutCode.ROOM_VARIABLE_EXTRA:
            return <WiredExtraRoomVariableView />;
        case WiredActionLayoutCode.CONTEXT_VARIABLE_EXTRA:
            return <WiredExtraContextVariableView />;
        case WiredActionLayoutCode.VARIABLE_REFERENCE_EXTRA:
            return <WiredExtraVariableReferenceView />;
        case WiredActionLayoutCode.VARIABLE_LEVELUP_SYSTEM_EXTRA:
            return <WiredExtraVariableLevelUpSystemView />;
        case WiredActionLayoutCode.VARIABLE_ECHO_EXTRA:
            return <WiredExtraVariableEchoView />;
        case WiredActionLayoutCode.TEXT_INPUT_VARIABLE_EXTRA:
            return <WiredExtraTextInputVariableView />;
        case WiredActionLayoutCode.SEND_SIGNAL:
            return <WiredActionSendSignalView />;
        case WiredActionLayoutCode.NEG_SEND_SIGNAL:
            return <WiredActionSendSignalView />;
    }

    return null;
};
