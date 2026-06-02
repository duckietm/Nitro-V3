import { FC, useEffect, useRef } from 'react';
import type { CommandDefinition } from '../../../../api';
import type { RankedCommandDefinition } from '../../../../hooks/rooms/widgets/useChatCommandSelector.helpers';

interface ChatInputCommandSelectorViewProps
{
    commands: RankedCommandDefinition[];
    selectedIndex: number;
    onSelect: (command: CommandDefinition) => void;
    onHover: (index: number) => void;
}

export const ChatInputCommandSelectorView: FC<ChatInputCommandSelectorViewProps> = props =>
{
    const { commands = [], selectedIndex = 0, onSelect = null, onHover = null } = props;
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!listRef.current) return;

        const selected = listRef.current.children[selectedIndex] as HTMLElement;

        if(selected) selected.scrollIntoView({ block: 'nearest' });
    }, [ selectedIndex ]);

    return (
        <div ref={ listRef } className="absolute bottom-full left-0 z-[1070] max-h-[238px] w-full overflow-y-auto rounded-t-[8px] border-2 border-b-0 border-black bg-[#f2f2eb] shadow-[0_-4px_14px_rgba(0,0,0,0.22)]">
            { commands.map((cmd, index) => (
                <button
                    key={ cmd.key }
                    className={ `flex min-h-[34px] w-full cursor-pointer items-center gap-2 border-b border-[#c6c6bd] px-3 py-1.5 text-left last:border-b-0 ${ index === selectedIndex ? 'bg-[#255d72] text-white' : 'text-black hover:bg-[#dceaf0]' }` }
                    type="button"
                    onClick={ () => onSelect(cmd) }
                    onMouseEnter={ () => onHover(index) }
                >
                    <span className={ `shrink-0 rounded-[4px] border px-1.5 py-[1px] font-bold ${ index === selectedIndex ? 'border-white/60 bg-white/15' : 'border-[#8ca6b1] bg-white text-[#123b4c]' }` }>:{ cmd.key }</span>
                    <span className={ `min-w-0 flex-1 truncate text-[12px] ${ index === selectedIndex ? 'text-white/85' : 'text-[#525252]' }` }>{ cmd.description }</span>
                </button>
            )) }
        </div>
    );
};
