import * as Popover from '@radix-ui/react-popover';
import { FC, useState } from 'react';
import { Flex, Grid, NitroCardContentView } from '../../../../common';

interface ChatInputStyleSelectorViewProps
{
  chatStyleId: number;
  chatStyleIds: number[];
  selectChatStyleId: (styleId: number) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = props =>
{
    const { chatStyleIds = null, selectChatStyleId = null } = props;
    const [ selectorVisible, setSelectorVisible ] = useState(false);

    const selectStyle = (styleId: number) =>
    {
        selectChatStyleId(styleId);
        setSelectorVisible(false);
    };

    return (
        <Popover.Root open={selectorVisible} onOpenChange={setSelectorVisible}>
            <Popover.Trigger asChild>
                <div className="chatstyles-anchor">
                    <div className="nitro-icon chatstyles-icon" />
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
                            {chatStyleIds && chatStyleIds.length > 0 && chatStyleIds.map(styleId => (
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
