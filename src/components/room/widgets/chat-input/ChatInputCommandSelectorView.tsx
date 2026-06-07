import { FC, useEffect, useRef } from 'react';
import { CommandDefinition } from '../../../../api';

interface ChatInputCommandSelectorViewProps
{
    commands: CommandDefinition[];
    selectedIndex: number;
    onSelect: (command: CommandDefinition) => void;
    onHover: (index: number) => void;
    /**
     * When true, render the flat minimalist look (gray list, dark-blue
     * selection). When false / undefined (default) the picker wears the
     * Habbo NitroCard chrome with the green :command header strip.
     */
    newStyle?: boolean;
}

/**
 * :command autocomplete popover. Two visual modes, both driven by the
 * "New style" toggle in user settings (memenu.settings.other.catalog.classic.style):
 *
 *   - newStyle = false (default): cream cardstock, habbo-green header,
 *     UbuntuCondensed names, green ":" tile, custom Habbo scrollbar.
 *   - newStyle = true: flat gray list, dark-blue selection, plain text rows.
 */
export const ChatInputCommandSelectorView: FC<ChatInputCommandSelectorViewProps> = props =>
{
    const { commands = [], selectedIndex = 0, onSelect = null, onHover = null, newStyle = false } = props;
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!listRef.current) return;

        const selected = listRef.current.children[selectedIndex] as HTMLElement;

        if(selected) selected.scrollIntoView({ block: 'nearest' });
    }, [ selectedIndex ]);

    if(newStyle)
    {
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
    }

    return (
        <div className="chat-input-command-popover">
            <div className="chat-input-command-popover-header">
                <span className="chat-input-command-popover-header-dot" aria-hidden />
                <span>: Command</span>
            </div>
            <div ref={ listRef } className="chat-input-command-popover-list has-classic-scrollbar">
                { commands.map((cmd, index) =>
                {
                    const isSelected = (index === selectedIndex);
                    const rowClass = [
                        'chat-input-command-row',
                        isSelected ? 'is-selected' : ''
                    ].filter(Boolean).join(' ');

                    return (
                        <div
                            key={ cmd.key }
                            className={ rowClass }
                            onClick={ () => onSelect(cmd) }
                            onMouseEnter={ () => onHover(index) }
                        >
                            <div className="chat-input-command-row-tile">:</div>
                            <div className="chat-input-command-row-body">
                                <span className="chat-input-command-row-name">:{ cmd.key }</span>
                                { cmd.description &&
                                    <span className="chat-input-command-row-desc">{ cmd.description }</span> }
                            </div>
                        </div>
                    );
                }) }
            </div>
        </div>
    );
};
