import * as Popover from '@radix-ui/react-popover';
import { FC, useState } from 'react';
import { Flex, Grid, NitroCardContentView } from '../../../../common';

interface ChatInputStyleSelectorViewProps {
    chatStyleId: number;
    chatStyleIds: number[];
    selectChatStyleId: (styleId: number) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = (props) => {
    const { chatStyleIds = null, selectChatStyleId = null } = props;
    const [selectorVisible, setSelectorVisible] = useState(false);

    const selectStyle = (styleId: number) => {
        selectChatStyleId(styleId);
        setSelectorVisible(false);
    };

    return (
        <Popover.Root open={selectorVisible} onOpenChange={setSelectorVisible}>
            <Popover.Trigger asChild>
                <div className="flex h-[26px] items-center gap-[3px] cursor-pointer select-none pl-[2px]" aria-label="Stili chat">
                    <svg className="h-[9px] w-[9px] shrink-0 text-black/70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="nitro-icon chatstyles-icon" style={{ filter: 'none' }} />
                </div>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="top"
                    sideOffset={12}
                    className="max-w-[276px] not-italic font-normal leading-normal text-left no-underline normal-case tracking-normal whitespace-normal text-[.7875rem] [word-wrap:break-word] bg-[#dfdfdf] bg-clip-padding border border-solid border-[#283F5D] rounded-[.25rem] [box-shadow:0_2px_#00000073] z-[1070]"
                >
                    <NitroCardContentView className="bg-transparent max-h-[210px]!" overflow="hidden">
                        <Grid columnCount={3} overflow="auto">
                            {chatStyleIds &&
                                chatStyleIds.length > 0 &&
                                chatStyleIds.map((styleId) => (
                                    <Flex key={styleId} center pointer className="h-[35px] w-[65px]" onClick={() => selectStyle(styleId)}>
                                        <div className="bubble-container relative w-[50px]">
                                            <div className={`relative max-w-[65px] min-h-[26px] text-[14px] chat-bubble bubble-${styleId}`} />
                                        </div>
                                    </Flex>
                                ))}
                        </Grid>
                    </NitroCardContentView>
                    <Popover.Arrow className="fill-black" width={14} height={7} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
