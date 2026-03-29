import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useFurniEditor } from '../../hooks/furni-editor';
import { FurniEditorEditView } from './views/FurniEditorEditView';
import { FurniEditorSearchView } from './views/FurniEditorSearchView';

const TAB_SEARCH = 0;
const TAB_EDIT = 1;

export const FurniEditorView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState(TAB_SEARCH);

    const {
        items, total, page, loading, error, clearError,
        selectedItem, setSelectedItem, furniDataEntry,
        interactions,
        searchItems, loadDetail, loadBySpriteId, updateItem, deleteItem, loadInteractions
    } = useFurniEditor();

    const isMod = GetSessionDataManager()?.isModerator;

    // Auto-switch to edit tab when an item is selected
    useEffect(() =>
    {
        if(selectedItem) setActiveTab(TAB_EDIT);
    }, [ selectedItem ]);

    useEffect(() =>
    {
        if(!isMod) return;

        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'furni-editor/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ isMod ]);

    useEffect(() =>
    {
        if(isVisible) loadInteractions();
    }, [ isVisible ]);

    // Escape to close
    useEffect(() =>
    {
        if(!isVisible) return;

        const handler = (e: KeyboardEvent) =>
        {
            if(e.key === 'Escape') setIsVisible(false);
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(!isMod) return;

        const handler = (e: CustomEvent<{ spriteId: number }>) =>
        {
            const { spriteId } = e.detail;

            setIsVisible(true);
            loadBySpriteId(spriteId);
        };

        window.addEventListener('furni-editor:open', handler as EventListener);

        return () => window.removeEventListener('furni-editor:open', handler as EventListener);
    }, [ isMod, loadBySpriteId ]);

    const handleSelect = useCallback((id: number) =>
    {
        loadDetail(id);
    }, [ loadDetail ]);

    const handleBack = useCallback(() =>
    {
        setSelectedItem(null);
        setActiveTab(TAB_SEARCH);
    }, [ setSelectedItem ]);

    const handleClose = useCallback(() =>
    {
        setIsVisible(false);
    }, []);

    if(!isVisible || !isMod) return null;

    return (
        <NitroCardView uniqueKey="furni-editor" className="w-[620px] h-[520px]">
            <NitroCardHeaderView headerText="Furni Editor" onCloseClick={ handleClose } />
            <NitroCardTabsView>
                <NitroCardTabsItemView isActive={ activeTab === TAB_SEARCH } onClick={ () => setActiveTab(TAB_SEARCH) }>
                    Search
                </NitroCardTabsItemView>
                <NitroCardTabsItemView isActive={ activeTab === TAB_EDIT } onClick={ () => selectedItem && setActiveTab(TAB_EDIT) }>
                    Edit
                </NitroCardTabsItemView>
            </NitroCardTabsView>
            <NitroCardContentView>
                { error &&
                    <div className="bg-[#f8d7da] border border-[#f5c6cb] rounded p-2 text-[#721c24] text-xs mb-1 flex justify-between items-center">
                        <span>{ error }</span>
                        <span className="cursor-pointer font-bold" onClick={ clearError }>x</span>
                    </div>
                }

                { activeTab === TAB_SEARCH &&
                    <FurniEditorSearchView
                        items={ items }
                        total={ total }
                        page={ page }
                        loading={ loading }
                        onSearch={ searchItems }
                        onSelect={ handleSelect }
                    />
                }

                { activeTab === TAB_EDIT && selectedItem &&
                    <FurniEditorEditView
                        item={ selectedItem }
                        furniDataEntry={ furniDataEntry }
                        interactions={ interactions }
                        loading={ loading }
                        onUpdate={ updateItem }
                        onDelete={ deleteItem }
                        onBack={ handleBack }
                    />
                }

            </NitroCardContentView>
        </NitroCardView>
    );
};
