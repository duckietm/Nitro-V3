import { AvatarEditorFigureCategory, AvatarFigurePartType, FigureDataContainer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetClubMemberLevel, GetConfigurationValue, IAvatarEditorCategory } from '../../api';
import { LayoutCurrencyIcon } from '../../common';
import { useAvatarEditor } from '../../hooks';
import { AvatarEditorIcon } from './AvatarEditorIcon';
import { AvatarEditorFigureSetView } from './figure-set';
import { AvatarEditorAdvancedColorView, AvatarEditorPaletteSetView } from './palette-set';

export const AvatarEditorModelView: FC<{
    name: string,
    categories: IAvatarEditorCategory[]
}> = props =>
{
    const { name = '', categories = [] } = props;
    const [ didChange, setDidChange ] = useState<boolean>(false);
    const [ activeSetType, setActiveSetType ] = useState<string>('');
    const [ advancedColorMode, setAdvancedColorMode ] = useState<boolean>(false);
    const hasHC = GetClubMemberLevel() > 0;
    const { maxPaletteCount = 1, gender = null, setGender = null, selectedColorParts = null, getFirstSelectableColor = null, selectEditorColor = null } = useAvatarEditor();

    const activeCategory = useMemo(() =>
    {
        return categories.find(category => category.setType === activeSetType) ?? null;
    }, [ categories, activeSetType ]);

    const selectSet = useCallback((setType: string) =>
    {
        const selectedPalettes = selectedColorParts[setType];

        if(!selectedPalettes || !selectedPalettes.length) selectEditorColor(setType, 0, getFirstSelectableColor(setType));

        setActiveSetType(setType);
    }, [ getFirstSelectableColor, selectEditorColor, selectedColorParts ]);

    useEffect(() =>
    {
        if(!categories || !categories.length || !didChange) return;

        selectSet(categories[0]?.setType);
        setDidChange(false);
    }, [ categories, didChange, selectSet ]);

    useEffect(() =>
    {
        setDidChange(true);
    }, [ categories ]);

    if(!activeCategory) return null;

    return (
        <div className="flex flex-col overflow-hidden h-full gap-1">
            <div className="flex items-center px-2 gap-3 shrink-0">
                { (name === AvatarEditorFigureCategory.GENERIC) &&
                    <>
                        <div className="category-item flex items-center justify-center cursor-pointer" onClick={ event => setGender(AvatarFigurePartType.MALE) }>
                            <AvatarEditorIcon icon="male" selected={ gender === FigureDataContainer.MALE } />
                        </div>
                        <div className="category-item flex items-center justify-center cursor-pointer" onClick={ event => setGender(AvatarFigurePartType.FEMALE) }>
                            <AvatarEditorIcon icon="female" selected={ gender === FigureDataContainer.FEMALE } />
                        </div>
                    </> }
                { (name !== AvatarEditorFigureCategory.GENERIC) && categories.map(category =>
                    <div
                        key={ category.setType }
                        className="category-item flex items-center justify-center cursor-pointer"
                        onClick={ event => selectSet(category.setType) }>
                        <AvatarEditorIcon icon={ category.setType } selected={ activeSetType === category.setType } />
                    </div>
                ) }
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <AvatarEditorFigureSetView category={ activeCategory } columnCount={ 6 } />
            </div>

            <div className="flex shrink-0 items-center justify-end px-2">
                <button
                    className={ `flex items-center gap-1 text-xs px-2 py-0.5 rounded border cursor-pointer transition-colors ${ advancedColorMode ? 'bg-sky-400 border-sky-300 text-white' : 'bg-sky-900/30 border-sky-600/50 text-white hover:text-yellow-800' }` }
                    onClick={ () => hasHC ? setAdvancedColorMode(prev => !prev) : CreateLinkEvent('habboUI/open/hccenter') }
                >
                    Advanced Color
                    <LayoutCurrencyIcon type="hc" />
                </button>
            </div>

            <div className={ `flex shrink-0 overflow-hidden gap-2 ${ maxPaletteCount === 2 ? 'dual-palette' : '' }` } style={ { height: '160px' } }>
                { (maxPaletteCount >= 1) &&
                    <div className="flex-1 min-w-0 overflow-hidden avatar-editor-palette-set-view">
                        { advancedColorMode
                            ? <AvatarEditorAdvancedColorView category={ activeCategory } paletteIndex={ 0 } />
                            : <AvatarEditorPaletteSetView category={ activeCategory } columnCount={ 14 } paletteIndex={ 0 } /> }
                    </div> }
                { (maxPaletteCount === 2) &&
                    <div className="flex-1 min-w-0 overflow-hidden avatar-editor-palette-set-view">
                        { advancedColorMode
                            ? <AvatarEditorAdvancedColorView category={ activeCategory } paletteIndex={ 1 } />
                            : <AvatarEditorPaletteSetView category={ activeCategory } columnCount={ 14 } paletteIndex={ 1 } /> }
                    </div> }
            </div>
        </div>
    );
};
