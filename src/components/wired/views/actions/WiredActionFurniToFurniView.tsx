import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector, FURNI_SOURCES, WiredSourceOption } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SECONDARY_SELECTED = 101;
const FURNI_DELIMITER = ';';

const TARGET_FURNI_SOURCES: WiredSourceOption[] = [
    { value: 0, label: 'wiredfurni.params.sources.furni.0' },
    { value: SOURCE_SECONDARY_SELECTED, label: 'wiredfurni.params.sources.furni.101' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' },
    { value: 201, label: 'wiredfurni.params.sources.furni.201' }
];

type SelectionMode = 'move' | 'target';

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

export const WiredActionFurniToFurniView: FC<{}> = () =>
{
    const [ moveSource, setMoveSource ] = useState<number>(SOURCE_TRIGGER);
    const [ targetSource, setTargetSource ] = useState<number>(SOURCE_TRIGGER);
    const [ moveFurniIds, setMoveFurniIds ] = useState<number[]>([]);
    const [ targetFurniIds, setTargetFurniIds ] = useState<number[]>([]);
    const [ selectionMode, setSelectionMode ] = useState<SelectionMode>('move');

    const highlightedIds = useRef<number[]>([]);

    const { trigger = null, furniIds = [], setFurniIds, setIntParams, setStringParam, setAllowsFurni } = useWired();

    const syncHighlights = useCallback((nextMoveIds: number[], nextTargetIds: number[]) =>
    {
        if(highlightedIds.current.length)
        {
            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
        }

        const targetSet = new Set(nextTargetIds);
        const moveOnlyIds = nextMoveIds.filter(id => !targetSet.has(id));

        if(moveOnlyIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(moveOnlyIds);
        if(nextTargetIds.length) WiredSelectionVisualizer.applySecondarySelectionShaderToFurni(nextTargetIds);

        highlightedIds.current = Array.from(new Set([ ...nextMoveIds, ...nextTargetIds ]));
    }, []);

    const switchSelection = useCallback((mode: SelectionMode) =>
    {
        const canEditMove = (moveSource === SOURCE_SELECTED);
        const canEditTarget = (targetSource === SOURCE_SECONDARY_SELECTED);

        if(mode === 'move' && !canEditMove) return;
        if(mode === 'target' && !canEditTarget) return;

        setSelectionMode(mode);
        setFurniIds([ ...(mode === 'move' ? moveFurniIds : targetFurniIds) ]);
    }, [ moveSource, targetSource, moveFurniIds, targetFurniIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const nextMoveIds = trigger.selectedItems ?? [];
        const nextTargetIds = parseIds(trigger.stringData);
        const nextMoveSource = (trigger.intData.length >= 1)
            ? trigger.intData[0]
            : (nextMoveIds.length ? SOURCE_SELECTED : SOURCE_TRIGGER);
        const nextTargetSourceRaw = (trigger.intData.length >= 2)
            ? trigger.intData[1]
            : (nextTargetIds.length ? SOURCE_SECONDARY_SELECTED : SOURCE_TRIGGER);
        const nextTargetSource = (nextTargetSourceRaw === SOURCE_SELECTED) ? SOURCE_SECONDARY_SELECTED : nextTargetSourceRaw;

        setMoveSource(nextMoveSource);
        setTargetSource(nextTargetSource);
        setMoveFurniIds(nextMoveIds);
        setTargetFurniIds(nextTargetIds);
        setSelectionMode('move');
        setFurniIds([ ...nextMoveIds ]);
    }, [ trigger, setFurniIds ]);

    useEffect(() =>
    {
        if(selectionMode === 'move') setMoveFurniIds(furniIds);
        else setTargetFurniIds(furniIds);
    }, [ furniIds, selectionMode ]);

    useEffect(() =>
    {
        syncHighlights(moveFurniIds, targetFurniIds);
    }, [ moveFurniIds, targetFurniIds, syncHighlights ]);

    useEffect(() =>
    {
        const canEditMove = (moveSource === SOURCE_SELECTED);
        const canEditTarget = (targetSource === SOURCE_SECONDARY_SELECTED);

        if(selectionMode === 'move' && !canEditMove && canEditTarget)
        {
            switchSelection('target');
            return;
        }

        if(selectionMode === 'target' && !canEditTarget && canEditMove)
        {
            switchSelection('move');
            return;
        }

        const canEditCurrent = ((selectionMode === 'move') ? canEditMove : canEditTarget);
        setAllowsFurni(canEditCurrent ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID : WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    }, [ selectionMode, moveSource, targetSource, switchSelection, setAllowsFurni ]);

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
        if(selectionMode === 'target')
        {
            setSelectionMode('move');
            setFurniIds([ ...moveFurniIds ]);
        }

        setIntParams([
            moveSource,
            targetSource
        ]);

        setStringParam(serializeIds(targetFurniIds));
    }, [ selectionMode, moveFurniIds, moveSource, targetSource, targetFurniIds, setFurniIds, setIntParams, setStringParam ]);

    const selectionLimit = trigger?.maximumItemSelectionCount ?? 0;

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            save={ save }
            footer={
                <div className="flex flex-col gap-2">
                    <WiredSourcesSelector
                        showFurni={ true }
                        furniTitle="wiredfurni.params.sources.furni.title.mv.0"
                        furniSources={ FURNI_SOURCES }
                        furniSource={ moveSource }
                        onChangeFurni={ setMoveSource } />
                    <hr className="m-0 bg-dark" />
                    <WiredSourcesSelector
                        showFurni={ true }
                        furniTitle="wiredfurni.params.sources.furni.title.mv.1"
                        furniSources={ TARGET_FURNI_SOURCES }
                        furniSource={ targetSource }
                        onChangeFurni={ value => setTargetSource((value === SOURCE_SELECTED) ? SOURCE_SECONDARY_SELECTED : value) } />
                </div>
            }>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <Text bold>{ LocalizeText('wiredfurni.params.sources.furni.title.mv.0') }</Text>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={ (selectionMode === 'move') ? 'primary' : 'secondary' }
                            disabled={ moveSource !== SOURCE_SELECTED }
                            onClick={ () => switchSelection('move') }>
                            { LocalizeText('wiredfurni.params.sources.furni.100') }
                        </Button>
                        <Text small>{ selectionLimit ? `${ moveFurniIds.length }/${ selectionLimit }` : moveFurniIds.length }</Text>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <Text bold>{ LocalizeText('wiredfurni.params.sources.furni.title.mv.1') }</Text>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={ (selectionMode === 'target') ? 'primary' : 'secondary' }
                            disabled={ targetSource !== SOURCE_SECONDARY_SELECTED }
                            onClick={ () => switchSelection('target') }>
                            { LocalizeText('wiredfurni.params.sources.furni.101') }
                        </Button>
                        <Text small>{ selectionLimit ? `${ targetFurniIds.length }/${ selectionLimit }` : targetFurniIds.length }</Text>
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
