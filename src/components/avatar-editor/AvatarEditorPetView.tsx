import { AvatarFigurePartType } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AvatarEditorThumbnailsHelper, CreateLinkEvent, GetClubMemberLevel, IAvatarEditorCategory, IAvatarEditorCategoryPartItem } from '../../api';
import { LayoutCurrencyIcon } from '../../common';
import { useAvatarEditor } from '../../hooks';
import { AvatarEditorFigureSetView } from './figure-set';
import { AvatarEditorAdvancedColorView, AvatarEditorPaletteSetView } from './palette-set';

export const AvatarEditorPetView: FC<{
    categories: IAvatarEditorCategory[];
}> = props =>
{
    const { categories = [] } = props;
    const [ slotThumbUrl, setSlotThumbUrl ] = useState<string>(null);
    const [ advancedColorMode, setAdvancedColorMode ] = useState<boolean>(false);
    const { selectedParts = null, selectEditorPart = null, selectedColorParts = null, maxPaletteCount = 1, getFirstSelectableColor = null, selectEditorColor = null } = useAvatarEditor();
    const hasHC = GetClubMemberLevel() > 0;

    const petCategory = categories.length ? categories[0] : null;
    const selectedPetSetId = selectedParts?.['pt'] ?? null;

    const selectedPartItem = useMemo(() =>
    {
        if(!selectedPetSetId || !petCategory?.partItems) return null;

        return petCategory.partItems.find(item => item.partSet?.id === selectedPetSetId) ?? null;
    }, [ selectedPetSetId, petCategory ]);

    // Ensure color is initialized when pet tab loads
    useEffect(() =>
    {
        if(!petCategory) return;

        const selectedPalettes = selectedColorParts?.['pt'];

        if(!selectedPalettes || !selectedPalettes.length) selectEditorColor('pt', 0, getFirstSelectableColor('pt'));
    }, [ petCategory, selectedColorParts, selectEditorColor, getFirstSelectableColor ]);

    useEffect(() =>
    {
        if(!selectedPartItem || !selectedPartItem.partSet)
        {
            setSlotThumbUrl(null);
            return;
        }

        const loadThumb = async () =>
        {
            const url = await AvatarEditorThumbnailsHelper.build(
                AvatarFigurePartType.PET,
                selectedPartItem,
                selectedPartItem.usesColor,
                selectedColorParts?.['pt'] ?? null
            );

            if(url) setSlotThumbUrl(url);
        };

        loadThumb();
    }, [ selectedPartItem, selectedColorParts ]);

    const removePet = useCallback(() =>
    {
        selectEditorPart('pt', -1);
        setSlotThumbUrl(null);
    }, [ selectEditorPart ]);

    if(!petCategory || !petCategory.partItems || !petCategory.partItems.length)
    {
        return (
            <div className="flex flex-col items-center justify-center h-full text-sm text-[#888]">
                No companion pets available.
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-hidden h-full gap-2">
            { /* Equipped pet bar */ }
            <div className="pet-equipped-bar">
                <div className="pet-equipped-preview">
                    { selectedPartItem
                        ? <div
                            className="pet-equipped-thumb"
                            style={ slotThumbUrl ? { backgroundImage: `url(${ slotThumbUrl })` } : {} } />
                        : <div className="pet-paw-icon opacity-20" />
                    }
                </div>
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                    { selectedPartItem
                        ? <>
                            <span className="text-xs font-bold text-white truncate">Companion Equipped</span>
                            <button className="pet-remove-btn" onClick={ removePet }>Remove</button>
                        </>
                        : <span className="text-xs text-[#ccc]">No companion selected</span>
                    }
                </div>
            </div>
            { /* Pet grid */ }
            <div className="flex-1 min-h-0 overflow-hidden pet-grid-container">
                <AvatarEditorFigureSetView category={ petCategory } columnCount={ 6 } />
            </div>
            { /* Color palette */ }
            { (petCategory.colorItems && petCategory.colorItems[0] && petCategory.colorItems[0].length > 0) &&
                <>
                    <div className="flex shrink-0 items-center justify-end px-2">
                        <button
                            className={ `flex items-center gap-1 text-xs px-2 py-0.5 rounded border cursor-pointer transition-colors ${ advancedColorMode ? 'bg-sky-400 border-sky-300 text-white' : 'bg-sky-900/30 border-sky-600/50 text-white hover:text-yellow-800' }` }
                            onClick={ () => hasHC ? setAdvancedColorMode(prev => !prev) : CreateLinkEvent('habboUI/open/hccenter') }
                        >
                            Advanced Color
                            <LayoutCurrencyIcon type="hc" />
                        </button>
                    </div>
                    <div className={ `flex shrink-0 overflow-hidden gap-2 ${ maxPaletteCount === 2 ? 'dual-palette' : '' }` } style={ { height: '80px' } }>
                        { (maxPaletteCount >= 1) &&
                            <div className="flex-1 min-w-0 overflow-hidden avatar-editor-palette-set-view">
                                { advancedColorMode
                                    ? <AvatarEditorAdvancedColorView category={ petCategory } paletteIndex={ 0 } />
                                    : <AvatarEditorPaletteSetView category={ petCategory } columnCount={ 14 } paletteIndex={ 0 } /> }
                            </div> }
                        { (maxPaletteCount === 2) &&
                            <div className="flex-1 min-w-0 overflow-hidden avatar-editor-palette-set-view">
                                { advancedColorMode
                                    ? <AvatarEditorAdvancedColorView category={ petCategory } paletteIndex={ 1 } />
                                    : <AvatarEditorPaletteSetView category={ petCategory } columnCount={ 14 } paletteIndex={ 1 } /> }
                            </div> }
                    </div>
                </> }
        </div>
    );
};
