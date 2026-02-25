import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { FC, useState } from 'react';
import { Popover } from 'react-tiny-popover';

interface ChatInputEmojiSelectorViewProps
{
    addChatEmoji: (emoji: string) => void;
}

export const ChatInputEmojiSelectorView: FC<ChatInputEmojiSelectorViewProps> = props =>
{
    const { addChatEmoji = null } = props;
    const [ selectorVisible, setSelectorVisible ] = useState(false);

    const handleEmojiSelect = (emoji: any) =>
    {
        addChatEmoji(emoji.native);
        setSelectorVisible(false);
    };

    const toggleSelector = () => setSelectorVisible(prev => !prev);

    return (
        <div>
            <Popover
                containerClassName="z-[1070]"
                content={ <Picker data={ data } onEmojiSelect={ handleEmojiSelect } /> }
                isOpen={ selectorVisible }
                positions={ [ 'top' ] }
                onClickOutside={ () => setSelectorVisible(false) }
            >
                <div className="cursor-pointer text-lg select-none px-1" onClick={ toggleSelector }>🙂</div>
            </Popover>
        </div>
    );
};
