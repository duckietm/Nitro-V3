import { RoomSessionPollEvent } from '@nitrots/nitro-renderer';
import { DispatchUiEvent, RoomWidgetPollUpdateEvent } from '../../../api';
import { useNitroEvent } from '../../events';

/**
 * Bridges the three poll-related renderer events (OFFER / ERROR / CONTENT)
 * onto the UI event bus. Pure subscription — no React state, no return
 * value. Mount this once where polls should be observable.
 *
 * This is the "subscriptions" half of the proposal #4 split for
 * usePollWidget. The "actions" half is in usePollActions.
 */
export const usePollSubscriptions = (): void =>
{
    useNitroEvent<RoomSessionPollEvent>(RoomSessionPollEvent.OFFER, event =>
    {
        const pollEvent = new RoomWidgetPollUpdateEvent(RoomWidgetPollUpdateEvent.OFFER, event.id);

        pollEvent.summary = event.summary;
        pollEvent.headline = event.headline;

        DispatchUiEvent(pollEvent);
    });

    useNitroEvent<RoomSessionPollEvent>(RoomSessionPollEvent.ERROR, event =>
    {
        const pollEvent = new RoomWidgetPollUpdateEvent(RoomWidgetPollUpdateEvent.ERROR, event.id);

        pollEvent.summary = event.summary;
        pollEvent.headline = event.headline;

        DispatchUiEvent(pollEvent);
    });

    useNitroEvent<RoomSessionPollEvent>(RoomSessionPollEvent.CONTENT, event =>
    {
        const pollEvent = new RoomWidgetPollUpdateEvent(RoomWidgetPollUpdateEvent.CONTENT, event.id);

        pollEvent.startMessage = event.startMessage;
        pollEvent.endMessage = event.endMessage;
        pollEvent.numQuestions = event.numQuestions;
        pollEvent.questionArray = event.questionArray;
        pollEvent.npsPoll = event.npsPoll;

        DispatchUiEvent(pollEvent);
    });
};
