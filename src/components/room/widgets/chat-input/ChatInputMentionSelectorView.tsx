import { FC, useEffect, useRef } from 'react';
import { LayoutAvatarImageView } from '../../../../common';
import { MentionSuggestion } from '../../../../hooks/rooms/widgets/useChatMentions.helpers';

interface ChatInputMentionSelectorViewProps
{
    suggestions: MentionSuggestion[];
    selectedIndex: number;
    onSelect: (suggestion: MentionSuggestion) => void;
    onHover: (index: number) => void;
    /**
     * When true, render the flat minimalist look (gray list, dark-blue
     * selection, no header / no kind chip). When false / undefined (default)
     * the picker wears the Habbo NitroCard chrome.
     */
    newStyle?: boolean;
}

/**
 * @-mention autocomplete popover. Two visual modes, both driven by the
 * "New style" toggle in user settings (memenu.settings.other.catalog.classic.style):
 *
 *   - newStyle = false (default): cream cardstock, habbo-blue header,
 *     UbuntuCondensed names, kind chips, custom Habbo scrollbar.
 *   - newStyle = true: flat gray list, dark-blue selection, plain text rows.
 *
 * Both modes share the same suggestion structure and keyboard contract -
 * the difference is purely cosmetic.
 */
export const ChatInputMentionSelectorView: FC<ChatInputMentionSelectorViewProps> = props =>
{
    const { suggestions = [], selectedIndex = 0, onSelect = null, onHover = null, newStyle = false } = props;
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!listRef.current) return;

        const selected = listRef.current.children[selectedIndex] as HTMLElement;

        if(selected) selected.scrollIntoView({ block: 'nearest' });
    }, [ selectedIndex ]);

    if(suggestions.length === 0) return null;

    if(newStyle)
    {
        return (
            <div ref={ listRef } className="absolute bottom-full left-0 w-full bg-[#e8e8e8] border-2 border-black border-b-0 rounded-t-lg max-h-[240px] overflow-y-auto z-[1070]">
                { suggestions.map((suggestion, index) =>
                {
                    const isSelected = (index === selectedIndex);
                    const rowClass = `px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 ${ isSelected ? 'bg-[#283F5D] text-white' : 'hover:bg-gray-300' }`;

                    return (
                        <div
                            key={ suggestion.key }
                            className={ rowClass }
                            onClick={ () => onSelect(suggestion) }
                            onMouseEnter={ () => onHover(index) }
                        >
                            { suggestion.kind === 'user' && suggestion.figure
                                ? (
                                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-black/10">
                                        <LayoutAvatarImageView
                                            figure={ suggestion.figure }
                                            direction={ 2 }
                                            headOnly
                                            style={ { backgroundSize: 'auto', backgroundPosition: '-22px -32px' } }
                                        />
                                    </div>
                                )
                                : (
                                    <div className="flex items-center justify-center h-11 w-11 rounded-full bg-black/20 text-white text-[14px] font-bold shrink-0">@</div>
                                ) }
                            <span className="font-bold">@{ suggestion.name }</span>
                            { suggestion.description && <span className={ `text-xs ${ isSelected ? 'text-gray-300' : 'text-gray-500' }` }>{ suggestion.description }</span> }
                        </div>
                    );
                }) }
            </div>
        );
    }

    return (
        <div className="chat-input-mention-popover">
            <div className="chat-input-mention-popover-header">
                <span className="chat-input-mention-popover-header-dot" aria-hidden />
                <span>@ Mention</span>
            </div>
            <div ref={ listRef } className="chat-input-mention-popover-list has-classic-scrollbar">
                { suggestions.map((suggestion, index) =>
                {
                    const isSelected = (index === selectedIndex);
                    const rowClass = [
                        'chat-input-mention-row',
                        isSelected ? 'is-selected' : ''
                    ].filter(Boolean).join(' ');

                    return (
                        <div
                            key={ suggestion.key }
                            className={ rowClass }
                            onClick={ () => onSelect(suggestion) }
                            onMouseEnter={ () => onHover(index) }
                        >
                            { suggestion.kind === 'user' && suggestion.figure
                                ? (
                                    <div className="chat-input-mention-row-tile">
                                        <LayoutAvatarImageView
                                            figure={ suggestion.figure }
                                            direction={ 2 }
                                            headOnly
                                        />
                                    </div>
                                )
                                : (
                                    <div className="chat-input-mention-row-tile is-alias">@</div>
                                ) }
                            <div className="chat-input-mention-row-body">
                                <span className="chat-input-mention-row-name">@{ suggestion.name }</span>
                                { suggestion.description &&
                                    <span className="chat-input-mention-row-desc">{ suggestion.description }</span> }
                            </div>
                            <span className={ `chat-input-mention-row-kind ${ suggestion.kind === 'alias' ? 'is-alias' : '' }` }>
                                { suggestion.kind === 'alias' ? 'Broadcast' : 'User' }
                            </span>
                        </div>
                    );
                }) }
            </div>
        </div>
    );
};
