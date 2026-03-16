import { FC, useEffect, useRef } from 'react';
import { CommandDefinition } from '../../../../api';

interface ChatInputCommandSelectorViewProps
{
    commands: CommandDefinition[];
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
        <div ref={ listRef } className="absolute bottom-full left-0 w-full bg-[#e8e8e8] border-2 border-black border-b-0 rounded-t-lg max-h-[240px] overflow-y-auto z-[1070]">
            { commands.map((cmd, index) => (
                <div
                    key={ cmd.key }
                    className={ `px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 ${ index === selectedIndex ? 'bg-[#283F5D] text-white' : 'hover:bg-gray-300' }` }
                    onClick={ () => onSelect(cmd) }
                    onMouseEnter={ () => onHover(index) }
                >
                    <span className="font-bold">:{ cmd.key }</span>
                    <span className={ `text-xs ${ index === selectedIndex ? 'text-gray-300' : 'text-gray-500' }` }>{ cmd.description }</span>
                </div>
            )) }
        </div>
    );
};
