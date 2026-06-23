import { useRoom } from '../useRoom';

/**
 * Imperative poll actions. Stateless on purpose — split from
 * usePollSubscriptions so components that only need to dispatch a
 * vote / accept / reject don't also register the global subscription
 * listeners.
 */
export const usePollActions = () => {
    const { roomSession = null } = useRoom();

    return {
        startPoll: (pollId: number) => roomSession?.sendPollStartMessage(pollId),
        rejectPoll: (pollId: number) => roomSession?.sendPollRejectMessage(pollId),
        answerPoll: (pollId: number, questionId: number, answers: string[]) => roomSession?.sendPollAnswerMessage(pollId, questionId, answers)
    };
};
