import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredFurniSelectionSourceRow } from '../WiredFurniSelectionSourceRow';
import { FURNI_SOURCES, sortWiredSourceOptions, WiredSourceOption } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SECONDARY_SELECTED = 101;
const FURNI_DELIMITER = ';';

const MATCH_FURNI_SOURCES: WiredSourceOption[] = sortWiredSourceOptions([
    ...FURNI_SOURCES,
    { value: SOURCE_SECONDARY_SELECTED, label: 'wiredfurni.params.sources.furni.101' }
], 'furni');

type SelectionMode = 'primary' | 'secondary';

const parseIds = (data: string): number[] =>
{
    if(!data || !data.length) return [];

    const ids = new Set<number>();

    for(const part of data.split(/[;,\t]/))
    {
        const trimmed = part.trim();
        if(!trimmed.length) continue;

        const value = parseInt(trimmed, 10);
        if(!isNaN(value) && value > 0) ids.add(value);
    }

    return Array.from(ids);
};

const serializeIds = (ids: number[]): string =>
{
    if(!ids || !ids.length) return '';

    return ids.filter(id => (id > 0)).join(FURNI_DELIMITER);
};

interface WiredConditionFurniIsOfTypeViewProps
{
    negative?: boolean;
}

export const WiredConditionFurniIsOfTypeView: FC<WiredConditionFurniIsOfTypeViewProps> = ({ negative = false }) =>
{
    const [ matchSource, setMatchSource ] = useState<number>(SOURCE_TRIGGER);
    const [ compareSource, setCompareSource ] = useState<number>(SOURCE_TRIGGER);
    const [ quantifier, setQuantifier ] = useState<number>(0);
    const [ primaryFurniIds, setPrimaryFurniIds ] = useState<number[]>([]);
    const [ secondaryFurniIds, setSecondaryFurniIds ] = useState<number[]>([]);
    const [ selectionMode, setSelectionMode ] = useState<SelectionMode>('primary');

    const highlightedIds = useRef<number[]>([]);

    const { trigger = null, furniIds = [], setFurniIds, setIntParams, setStringParam, setAllowsFurni } = useWired();

    const syncHighlights = useCallback((nextPrimaryIds: number[], nextSecondaryIds: number[]) =>
    {
        if(highlightedIds.current.length)
        {
            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
        }

        const secondarySet = new Set(nextSecondaryIds);
        const primaryOnlyIds = nextPrimaryIds.filter(id => !secondarySet.has(id));

        if(primaryOnlyIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(primaryOnlyIds);
        if(nextSecondaryIds.length) WiredSelectionVisualizer.applySecondarySelectionShaderToFurni(nextSecondaryIds);

        highlightedIds.current = Array.from(new Set([ ...nextPrimaryIds, ...nextSecondaryIds ]));
    }, []);

    const switchSelection = useCallback((mode: SelectionMode) =>
    {
        const canEditPrimary = (matchSource === SOURCE_SELECTED) || (compareSource === SOURCE_SELECTED);
        const canEditSecondary = (matchSource === SOURCE_SECONDARY_SELECTED) || (compareSource === SOURCE_SECONDARY_SELECTED);

        if(mode === 'primary' && !canEditPrimary) return;
        if(mode === 'secondary' && !canEditSecondary) return;

        const nextPrimaryIds = (selectionMode === 'primary') ? [ ...furniIds ] : [ ...primaryFurniIds ];
        const nextSecondaryIds = (selectionMode === 'secondary') ? [ ...furniIds ] : [ ...secondaryFurniIds ];

        setPrimaryFurniIds(nextPrimaryIds);
        setSecondaryFurniIds(nextSecondaryIds);
        setSelectionMode(mode);
        setFurniIds([ ...(mode === 'primary' ? nextPrimaryIds : nextSecondaryIds) ]);
    }, [ selectionMode, furniIds, matchSource, compareSource, primaryFurniIds, secondaryFurniIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const nextPrimaryIds = trigger.selectedItems ?? [];
        const nextSecondaryIds = parseIds(trigger.stringData);
        const nextMatchSource = (trigger.intData.length >= 1)
            ? trigger.intData[0]
            : (nextPrimaryIds.length ? SOURCE_SELECTED : SOURCE_TRIGGER);
        const nextCompareSource = (trigger.intData.length >= 2)
            ? trigger.intData[1]
            : (nextSecondaryIds.length ? SOURCE_SECONDARY_SELECTED : SOURCE_TRIGGER);
        const nextQuantifier = (trigger.intData.length >= 3)
            ? (trigger.intData[2] === 1 ? 1 : 0)
            : 0;

        setMatchSource(nextMatchSource);
        setCompareSource(nextCompareSource);
        setQuantifier(nextQuantifier);
        setPrimaryFurniIds(nextPrimaryIds);
        setSecondaryFurniIds(nextSecondaryIds);
        setSelectionMode('primary');
        setFurniIds([ ...nextPrimaryIds ]);
    }, [ trigger, setFurniIds, negative ]);

    useEffect(() =>
    {
        if(selectionMode === 'primary') setPrimaryFurniIds(furniIds);
        else setSecondaryFurniIds(furniIds);
    }, [ furniIds, selectionMode ]);

    useEffect(() =>
    {
        syncHighlights(primaryFurniIds, secondaryFurniIds);
    }, [ primaryFurniIds, secondaryFurniIds, syncHighlights ]);

    useEffect(() =>
    {
        const canEditPrimary = (matchSource === SOURCE_SELECTED) || (compareSource === SOURCE_SELECTED);
        const canEditSecondary = (matchSource === SOURCE_SECONDARY_SELECTED) || (compareSource === SOURCE_SECONDARY_SELECTED);

        if(selectionMode === 'primary' && !canEditPrimary && canEditSecondary)
        {
            switchSelection('secondary');
            return;
        }

        if(selectionMode === 'secondary' && !canEditSecondary && canEditPrimary)
        {
            switchSelection('primary');
            return;
        }

        const canEditCurrent = ((selectionMode === 'primary') ? canEditPrimary : canEditSecondary);

        setAllowsFurni(canEditCurrent ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE : WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    }, [ selectionMode, matchSource, compareSource, switchSelection, setAllowsFurni ]);

    useEffect(() =>
    {
        return () =>
        {
            if(!highlightedIds.current.length) return;

            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
            highlightedIds.current = [];
        };
    }, []);

    const save = useCallback(() =>
    {
        const nextPrimaryIds = (selectionMode === 'primary') ? [ ...furniIds ] : [ ...primaryFurniIds ];
        const nextSecondaryIds = (selectionMode === 'secondary') ? [ ...furniIds ] : [ ...secondaryFurniIds ];

        setPrimaryFurniIds(nextPrimaryIds);
        setSecondaryFurniIds(nextSecondaryIds);

        if(selectionMode === 'secondary')
        {
            setSelectionMode('primary');
            setFurniIds([ ...nextPrimaryIds ]);
        }

        setIntParams([
            matchSource,
            compareSource,
            quantifier
        ]);
        setStringParam(serializeIds(nextSecondaryIds));
    }, [ selectionMode, furniIds, primaryFurniIds, matchSource, compareSource, quantifier, secondaryFurniIds, setFurniIds, setIntParams, setStringParam ]);

    const selectionLimit = trigger?.maximumItemSelectionCount ?? 0;
    const quantifierKeyPrefix = negative ? 'wiredfurni.params.quantifier.furni.neg' : 'wiredfurni.params.quantifier.furni';

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            save={ save }
            selectionPreview={
                <div className="flex flex-col gap-2">
                    <WiredFurniSelectionSourceRow
                        title="wiredfurni.params.sources.furni.title.match.0"
                        options={ MATCH_FURNI_SOURCES }
                        value={ matchSource }
                        selectionKind="primary"
                        selectionActive={ selectionMode === 'primary' }
                        selectionCount={ primaryFurniIds.length }
                        selectionLimit={ selectionLimit }
                        selectionEnabledValues={ [ SOURCE_SELECTED ] }
                        onChange={ setMatchSource }
                        onSelectionActivate={ () => switchSelection('primary') } />
                    <WiredFurniSelectionSourceRow
                        title="wiredfurni.params.sources.furni.title.match.1"
                        options={ MATCH_FURNI_SOURCES }
                        value={ compareSource }
                        selectionKind="secondary"
                        selectionActive={ selectionMode === 'secondary' }
                        selectionCount={ secondaryFurniIds.length }
                        selectionLimit={ selectionLimit }
                        selectionEnabledValues={ [ SOURCE_SECONDARY_SELECTED ] }
                        onChange={ setCompareSource }
                        onSelectionActivate={ () => switchSelection('secondary') } />
                </div>
            }
        >
            <div className="flex flex-col gap-2">
                <Text bold>{ LocalizeText('wiredfurni.params.quantifier_selection') }</Text>
                { [ 0, 1 ].map(value => (
                    <label key={ value } className="flex items-center gap-1">
                        <input checked={ (quantifier === value) } className="form-check-input" name="stuffIsQuantifier" type="radio" onChange={ () => setQuantifier(value) } />
                        <Text>{ LocalizeText(`${ quantifierKeyPrefix }.${ value }`) }</Text>
                    </label>
                )) }
            </div>
        </WiredConditionBaseView>
    );
};
