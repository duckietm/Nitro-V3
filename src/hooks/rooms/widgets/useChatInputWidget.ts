import { useChatInputActions } from './useChatInputActions';
import { useChatInputState } from './useChatInputState';

/**
 * @deprecated Use `useChatInputState` and `useChatInputActions`
 * directly. This shim preserves the
 * `{ selectedUsername, floodBlocked, floodBlockedSeconds, setIsTyping,
 *    setIsIdle, sendChat }` shape so the single consumer (`ChatInputView`)
 * keeps working unchanged.
 */
export const useChatInputWidget = () => {
    const { selectedUsername, floodBlocked, floodBlockedSeconds, setIsTyping, setIsIdle } = useChatInputState();
    const { sendChat } = useChatInputActions();

    return { selectedUsername, floodBlocked, floodBlockedSeconds, setIsTyping, setIsIdle, sendChat };
};
