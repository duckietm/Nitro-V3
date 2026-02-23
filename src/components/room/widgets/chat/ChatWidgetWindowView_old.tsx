import { FC, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatEntryType } from '../../../../api';
import { DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useChatHistory } from '../../../../hooks';
import { useRoom } from '../../../../hooks/rooms';

const BOTTOM_SCROLL_THRESHOLD = 20;

export const ChatWidgetWindowView: FC<{}> = () =>
{
    const contentRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef(0);
    const [ isAutoScrollEnabled, setIsAutoScrollEnabled ] = useState(true);
    const { chatHistory = [] } = useChatHistory();
    const { roomSession = null } = useRoom();

    const roomChatHistory = useMemo(() => chatHistory.filter(chat => ((chat.type === ChatEntryType.TYPE_CHAT) && (chat.roomId === roomSession?.roomId))), [ chatHistory, roomSession?.roomId ]);

    const isAtBottom = useCallback((element: HTMLDivElement) =>
    {
        const distanceToBottom = (element.scrollHeight - element.clientHeight - element.scrollTop);

        return (distanceToBottom <= BOTTOM_SCROLL_THRESHOLD);
    }, []);

    const scrollToLatest = useCallback((smooth: boolean = true) =>
    {
        if(!contentRef.current) return;

        const element = contentRef.current;

        element.scrollTo({ top: element.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    const onScroll = useCallback((event: UIEvent<HTMLDivElement>) =>
    {
        const element = event.currentTarget;
        const atBottom = isAtBottom(element);
        const isScrollingUp = (element.scrollTop < lastScrollTop.current);

        lastScrollTop.current = element.scrollTop;

        if(atBottom)
        {
            if(!isAutoScrollEnabled) setIsAutoScrollEnabled(true);

            return;
        }

        if(isAutoScrollEnabled && isScrollingUp) setIsAutoScrollEnabled(false);
    }, [ isAtBottom, isAutoScrollEnabled ]);

    useEffect(() =>
    {
        if(!contentRef.current || !isAutoScrollEnabled) return;

        scrollToLatest();
    }, [ roomChatHistory.length, isAutoScrollEnabled, scrollToLatest ]);

    return (
        <NitroCardView
            className="w-[460px] h-[240px]"
            disableDrag={ false }
            style={ { pointerEvents: 'auto' } }
            theme="primary-slim"
            uniqueKey="chat-widget-window"
            windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText="Chat window" />
            <NitroCardContentView className="bg-[#f2f2f2] relative" overflow="hidden">
                <div ref={ contentRef } className="h-full overflow-y-auto px-2 py-1 text-black text-[13px] leading-4" onScroll={ onScroll }>
                    { roomChatHistory.map(chat => (
                        <div key={ `${ chat.timestamp }-${ chat.id }` } className="mb-1 flex items-start gap-1 break-words">
                            <div className="w-[65px] h-[50px] shrink-0 mt-[-8px] rounded-sm bg-no-repeat bg-center scale-70" style={ chat.imageUrl ? { backgroundImage: `url(${ chat.imageUrl })` } : undefined } />
                            <div>
                                <b dangerouslySetInnerHTML={ { __html: `${ chat.name }: ` } } />
                                <span dangerouslySetInnerHTML={ { __html: chat.message } } />
                            </div>
                        </div>
                    )) }
                </div>
                { !isAutoScrollEnabled && (
                    <button className="absolute bottom-2 right-2 px-2 py-1 text-white text-[11px] rounded bg-black/45 hover:bg-black/60" onClick={ () =>
                    {
                        setIsAutoScrollEnabled(true);
                        scrollToLatest();
                    } } type="button">
                        Go to latest message
                    </button>
                ) }
            </NitroCardContentView>
        </NitroCardView>
    );
};
