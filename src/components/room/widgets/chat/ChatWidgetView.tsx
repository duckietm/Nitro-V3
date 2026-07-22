import { RoomChatSettings } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef } from 'react';
import { ChatBubbleMessage, GetConfigurationValue } from '../../../../api';
import { useChatWidget, useChatWindow } from '../../../../hooks';
import IntervalWebWorker from '../../../../workers/IntervalWebWorker';
import { WorkerBuilder } from '../../../../workers/WorkerBuilder';
import { CHAT_TEXT_SIZE_EVENT } from '../chat-input/chatTextSize';
import { ChatWidgetMessageView } from './ChatWidgetMessageView';
import { ChatWidgetWindowView } from './ChatWidgetWindowView';

const CHAT_MOVE_UP_PIXELS = 19;
const CHAT_COLLISION_ITERATIONS = 20;
const CHAT_COLLISION_MIN_WIDTH = 240;
const CHAT_COLLISION_GAP = 1;
const CHAT_REMOVE_TOP_MARGIN = -10;

export const ChatWidgetView: FC<{}> = (props) => {
    const { chatMessages = [], setChatMessages = null, chatSettings = null, getScrollSpeed = 6000 } = useChatWidget();
    const [chatWindowEnabled] = useChatWindow();
    const elementRef = useRef<HTMLDivElement>(null);

    const removeHiddenChats = useCallback(() => {
        setChatMessages((prevValue) => {
            if (prevValue) {
                const newMessages = prevValue.filter((chat) => chat.top + chat.height >= CHAT_REMOVE_TOP_MARGIN);

                if (newMessages.length !== prevValue.length) return newMessages;
            }

            return prevValue;
        });
    }, [setChatMessages]);

    const refreshChatMeasurements = useCallback(() => {
        chatMessages.forEach((chat) => {
            if (!chat.elementRef) return;

            chat.width = chat.elementRef.offsetWidth;
            chat.height = chat.elementRef.offsetHeight;
        });
    }, [chatMessages]);

    const getChatCollisionRect = useCallback((chat: ChatBubbleMessage) => {
        const width = Math.max(chat.width, CHAT_COLLISION_MIN_WIDTH);
        const horizontalPadding = Math.max(0, (width - chat.width) / 2);

        return {
            left: chat.left - horizontalPadding,
            right: chat.left + chat.width + horizontalPadding,
            top: chat.top,
            bottom: chat.top + chat.height
        };
    }, []);

    const resolveOverlappingChats = useCallback(() => {
        const visibleChats = chatMessages.filter((chat) => chat.elementRef && chat.width > 0 && chat.height > 0);

        for (let iteration = 0; iteration < CHAT_COLLISION_ITERATIONS; iteration++) {
            let moved = false;

            for (let firstIndex = 0; firstIndex < visibleChats.length; firstIndex++) {
                const firstChat = visibleChats[firstIndex];

                for (let secondIndex = firstIndex + 1; secondIndex < visibleChats.length; secondIndex++) {
                    const secondChat = visibleChats[secondIndex];
                    const firstRect = getChatCollisionRect(firstChat);
                    const secondRect = getChatCollisionRect(secondChat);
                    const overlapsHorizontally = firstRect.left < secondRect.right && firstRect.right > secondRect.left;
                    const overlapsVertically = firstRect.top < secondRect.bottom && firstRect.bottom > secondRect.top;

                    if (!overlapsHorizontally || !overlapsVertically) continue;

                    const topChat =
                        firstChat.top < secondChat.top || (Math.abs(firstChat.top - secondChat.top) < 1 && firstChat.id < secondChat.id)
                            ? firstChat
                            : secondChat;
                    const bottomRect = topChat === firstChat ? secondRect : firstRect;
                    const topRect = topChat === firstChat ? firstRect : secondRect;
                    const amount = Math.max(CHAT_COLLISION_GAP, topRect.bottom - bottomRect.top + CHAT_COLLISION_GAP);

                    topChat.top -= amount;
                    moved = true;
                }
            }

            if (!moved) break;
        }
    }, [chatMessages, getChatCollisionRect]);

    const makeRoom = useCallback(
        (chat: ChatBubbleMessage) => {
            refreshChatMeasurements();

            if (chatSettings.mode === RoomChatSettings.CHAT_MODE_FREE_FLOW) {
                resolveOverlappingChats();

                removeHiddenChats();
            } else {
                const lowestPoint = chat.top + chat.height;
                const requiredSpace = chat.height;
                const spaceAvailable = elementRef.current.offsetHeight - lowestPoint;
                const amount = requiredSpace - spaceAvailable;

                if (spaceAvailable < requiredSpace) {
                    setChatMessages((prevValue) => {
                        prevValue.forEach((prevChat) => {
                            if (prevChat === chat) return;

                            prevChat.top -= amount;
                        });

                        return prevValue;
                    });

                    removeHiddenChats();
                }

                resolveOverlappingChats();
            }
        },
        [chatSettings, refreshChatMeasurements, removeHiddenChats, resolveOverlappingChats, setChatMessages]
    );

    useEffect(() => {
        const resize = (event: UIEvent = null) => {
            if (!elementRef || !elementRef.current) return;

            const currentHeight = elementRef.current.offsetHeight;
            const newHeight = Math.round(document.body.offsetHeight * GetConfigurationValue<number>('chat.viewer.height.percentage'));

            elementRef.current.style.height = `${newHeight}px`;

            setChatMessages((prevValue) => {
                if (prevValue) {
                    prevValue.forEach((chat) => (chat.top -= currentHeight - newHeight));
                }

                return prevValue;
            });

            window.requestAnimationFrame(() => {
                refreshChatMeasurements();
                resolveOverlappingChats();
                removeHiddenChats();
            });
        };

        window.addEventListener('resize', resize);

        resize();

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, [refreshChatMeasurements, removeHiddenChats, resolveOverlappingChats, setChatMessages]);

    useEffect(() => {
        const moveAllChatsUp = (amount: number) => {
            setChatMessages((prevValue) => {
                prevValue.forEach((chat) => {
                    chat.top -= amount;
                });

                return prevValue;
            });

            refreshChatMeasurements();
            resolveOverlappingChats();
            removeHiddenChats();
        };

        const worker = new WorkerBuilder(IntervalWebWorker);

        worker.onmessage = () => moveAllChatsUp(CHAT_MOVE_UP_PIXELS);

        worker.postMessage({ action: 'START', content: getScrollSpeed });

        return () => {
            worker.postMessage({ action: 'STOP' });

            worker.terminate();
        };
    }, [getScrollSpeed, refreshChatMeasurements, removeHiddenChats, resolveOverlappingChats, setChatMessages]);

    useEffect(() => {
        const onTextSizeChange = () => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    refreshChatMeasurements();
                    resolveOverlappingChats();
                    removeHiddenChats();
                });
            });
        };

        window.addEventListener(CHAT_TEXT_SIZE_EVENT, onTextSizeChange);

        return () => window.removeEventListener(CHAT_TEXT_SIZE_EVENT, onTextSizeChange);
    }, [refreshChatMeasurements, removeHiddenChats, resolveOverlappingChats]);

    return (
        <div
            ref={elementRef}
            className="absolute flex justify-center items-center w-full top-0 min-h-px z-(--chat-zindex) bg-transparent roundehidden shadow-none pointer-events-none"
        >
            {!chatWindowEnabled &&
                chatMessages.map((chat) => <ChatWidgetMessageView key={chat.id} bubbleWidth={chatSettings.weight} chat={chat} makeRoom={makeRoom} />)}
            {chatWindowEnabled && <ChatWidgetWindowView />}
        </div>
    );
};
