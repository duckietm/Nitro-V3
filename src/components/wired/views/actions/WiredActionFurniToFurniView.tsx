import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredFurniSelectionSourceRow } from '../WiredFurniSelectionSourceRow';
import { FURNI_SOURCES, sortWiredSourceOptions, WiredSourceOption } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SECONDARY_SELECTED = 101;
const FURNI_DELIMITER = ';';

const TARGET_FURNI_SOURCES: WiredSourceOption[] = sortWiredSourceOptions(
    [
        { value: 0, label: 'wiredfurni.params.sources.furni.0' },
        { value: SOURCE_SECONDARY_SELECTED, label: 'wiredfurni.params.sources.furni.101' },
        { value: 200, label: 'wiredfurni.params.sources.furni.200' },
        { value: 201, label: 'wiredfurni.params.sources.furni.201' }
    ],
    'furni'
);

type SelectionMode = 'move' | 'target';

const parseIds = (data: string): number[] => {
    if (!data || !data.length) return [];

    const ids = new Set<number>();

    for (const part of data.split(/[;,\t]/)) {
        const trimmed = part.trim();
        if (!trimmed.length) continue;

        const value = parseInt(trimmed, 10);
        if (!isNaN(value) && value > 0) ids.add(value);
    }

    return Array.from(ids);
};

const serializeIds = (ids: number[]): string => {
    if (!ids || !ids.length) return '';

    return ids.filter((id) => id > 0).join(FURNI_DELIMITER);
};

export const WiredActionFurniToFurniView: FC<{}> = () => {
    const [moveSource, setMoveSource] = useState<number>(SOURCE_TRIGGER);
    const [targetSource, setTargetSource] = useState<number>(SOURCE_TRIGGER);
    const [moveFurniIds, setMoveFurniIds] = useState<number[]>([]);
    const [targetFurniIds, setTargetFurniIds] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('move');

    const highlightedIds = useRef<number[]>([]);

    const { trigger = null, furniIds = [], setFurniIds, setIntParams, setStringParam, setAllowsFurni } = useWired();

    const syncHighlights = useCallback((nextMoveIds: number[], nextTargetIds: number[]) => {
        if (highlightedIds.current.length) {
            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
        }

        const targetSet = new Set(nextTargetIds);
        const moveOnlyIds = nextMoveIds.filter((id) => !targetSet.has(id));

        if (moveOnlyIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(moveOnlyIds);
        if (nextTargetIds.length) WiredSelectionVisualizer.applySecondarySelectionShaderToFurni(nextTargetIds);

        highlightedIds.current = Array.from(new Set([...nextMoveIds, ...nextTargetIds]));
    }, []);

    const switchSelection = useCallback(
        (mode: SelectionMode) => {
            const canEditMove = moveSource === SOURCE_SELECTED;
            const canEditTarget = targetSource === SOURCE_SECONDARY_SELECTED;

            if (mode === 'move' && !canEditMove) return;
            if (mode === 'target' && !canEditTarget) return;

            const nextMoveIds = selectionMode === 'move' ? [...furniIds] : [...moveFurniIds];
            const nextTargetIds = selectionMode === 'target' ? [...furniIds] : [...targetFurniIds];

            setMoveFurniIds(nextMoveIds);
            setTargetFurniIds(nextTargetIds);
            setSelectionMode(mode);
            setFurniIds([...(mode === 'move' ? nextMoveIds : nextTargetIds)]);
        },
        [selectionMode, furniIds, moveSource, targetSource, moveFurniIds, targetFurniIds, setFurniIds]
    );

    useEffect(() => {
        if (!trigger) return;

        const nextMoveIds = trigger.selectedItems ?? [];
        const nextTargetIds = parseIds(trigger.stringData);
        const nextMoveSource = trigger.intData.length >= 1 ? trigger.intData[0] : nextMoveIds.length ? SOURCE_SELECTED : SOURCE_TRIGGER;
        const nextTargetSourceRaw = trigger.intData.length >= 2 ? trigger.intData[1] : nextTargetIds.length ? SOURCE_SECONDARY_SELECTED : SOURCE_TRIGGER;
        const nextTargetSource = nextTargetSourceRaw === SOURCE_SELECTED ? SOURCE_SECONDARY_SELECTED : nextTargetSourceRaw;

        setMoveSource(nextMoveSource);
        setTargetSource(nextTargetSource);
        setMoveFurniIds(nextMoveIds);
        setTargetFurniIds(nextTargetIds);
        setSelectionMode('move');
        setFurniIds([...nextMoveIds]);
    }, [trigger, setFurniIds]);

    useEffect(() => {
        if (selectionMode === 'move') setMoveFurniIds(furniIds);
        else setTargetFurniIds(furniIds);
    }, [furniIds, selectionMode]);

    useEffect(() => {
        syncHighlights(moveFurniIds, targetFurniIds);
    }, [moveFurniIds, targetFurniIds, syncHighlights]);

    useEffect(() => {
        const canEditMove = moveSource === SOURCE_SELECTED;
        const canEditTarget = targetSource === SOURCE_SECONDARY_SELECTED;

        if (selectionMode === 'move' && !canEditMove && canEditTarget) {
            switchSelection('target');
            return;
        }

        if (selectionMode === 'target' && !canEditTarget && canEditMove) {
            switchSelection('move');
            return;
        }

        const canEditCurrent = selectionMode === 'move' ? canEditMove : canEditTarget;
        setAllowsFurni(canEditCurrent ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID : WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    }, [selectionMode, moveSource, targetSource, switchSelection, setAllowsFurni]);

    useEffect(() => {
        return () => {
            if (!highlightedIds.current.length) return;

            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
            highlightedIds.current = [];
        };
    }, []);

    const save = useCallback(() => {
        const nextMoveIds = selectionMode === 'move' ? [...furniIds] : [...moveFurniIds];
        const nextTargetIds = selectionMode === 'target' ? [...furniIds] : [...targetFurniIds];

        setMoveFurniIds(nextMoveIds);
        setTargetFurniIds(nextTargetIds);

        if (selectionMode === 'target') {
            setSelectionMode('move');
            setFurniIds([...nextMoveIds]);
        }

        setIntParams([moveSource, targetSource]);

        setStringParam(serializeIds(nextTargetIds));
    }, [selectionMode, furniIds, moveFurniIds, moveSource, targetSource, targetFurniIds, setFurniIds, setIntParams, setStringParam]);

    const selectionLimit = trigger?.maximumItemSelectionCount ?? 0;

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID}
            save={save}
            selectionPreview={
                <div className="flex flex-col gap-2">
                    <WiredFurniSelectionSourceRow
                        title="wiredfurni.params.sources.furni.title.mv.0"
                        options={FURNI_SOURCES}
                        value={moveSource}
                        selectionKind="primary"
                        selectionActive={selectionMode === 'move'}
                        selectionCount={moveFurniIds.length}
                        selectionLimit={selectionLimit}
                        selectionEnabledValues={[SOURCE_SELECTED]}
                        onChange={setMoveSource}
                        onSelectionActivate={() => switchSelection('move')}
                    />
                    <WiredFurniSelectionSourceRow
                        title="wiredfurni.params.sources.furni.title.mv.1"
                        options={TARGET_FURNI_SOURCES}
                        value={targetSource}
                        selectionKind="secondary"
                        selectionActive={selectionMode === 'target'}
                        selectionCount={targetFurniIds.length}
                        selectionLimit={selectionLimit}
                        selectionEnabledValues={[SOURCE_SECONDARY_SELECTED]}
                        onChange={(value) => setTargetSource(value === SOURCE_SELECTED ? SOURCE_SECONDARY_SELECTED : value)}
                        onSelectionActivate={() => switchSelection('target')}
                    />
                </div>
            }
        />
    );
};
