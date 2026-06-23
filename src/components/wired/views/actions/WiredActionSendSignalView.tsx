import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredFurniSelectionSourceRow } from '../WiredFurniSelectionSourceRow';
import { FURNI_SOURCES, USER_SOURCES } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;

const FORWARD_ITEM_DELIMITER = ';';

type SelectionMode = 'antenna' | 'furni';

const parseForwardIds = (data: string): number[] => {
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

const serializeForwardIds = (ids: number[]): string => {
    if (!ids || !ids.length) return '';

    return ids.filter((id) => id > 0).join(FORWARD_ITEM_DELIMITER);
};

export const WiredActionSendSignalView: FC<{}> = () => {
    const [furniSource, setFurniSource] = useState<number>(SOURCE_TRIGGER);
    const [userSource, setUserSource] = useState<number>(SOURCE_TRIGGER);
    const [signalPerFurni, setSignalPerFurni] = useState(false);
    const [signalPerUser, setSignalPerUser] = useState(false);
    const [antennaIds, setAntennaIds] = useState<number[]>([]);
    const [forwardFurniIds, setForwardFurniIds] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('antenna');
    const highlightedIds = useRef<number[]>([]);

    const { trigger = null, furniIds = [], setFurniIds = null, setIntParams = null, setStringParam = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const p = trigger.intData;
        if (p.length > 1) setFurniSource(p[1]);
        else setFurniSource(SOURCE_TRIGGER);

        if (p.length > 2) setUserSource(p[2]);
        else setUserSource(SOURCE_TRIGGER);

        setSignalPerFurni(p.length > 3 && p[3] === 1);
        setSignalPerUser(p.length > 4 && p[4] === 1);

        setAntennaIds(trigger.selectedItems ?? []);
        setForwardFurniIds(parseForwardIds(trigger.stringData));
        setSelectionMode('antenna');
    }, [trigger]);

    useEffect(() => {
        if (selectionMode === 'antenna') setAntennaIds(furniIds);
        else setForwardFurniIds(furniIds);
    }, [furniIds, selectionMode]);

    const syncHighlights = useCallback((nextAntennaIds: number[], nextForwardFurniIds: number[], nextSelectionMode: SelectionMode, nextFurniSource: number) => {
        if (highlightedIds.current.length) {
            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
        }

        const visibleForwardIds = nextFurniSource === SOURCE_SELECTED ? nextForwardFurniIds : [];
        const activeIds = nextSelectionMode === 'antenna' ? nextAntennaIds : visibleForwardIds;
        const passiveIds = nextSelectionMode === 'antenna' ? visibleForwardIds : nextAntennaIds;
        const activeSet = new Set(activeIds);
        const passiveOnlyIds = passiveIds.filter((id) => !activeSet.has(id));

        if (activeIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(activeIds);
        if (passiveOnlyIds.length) WiredSelectionVisualizer.applySecondarySelectionShaderToFurni(passiveOnlyIds);

        highlightedIds.current = Array.from(new Set([...activeIds, ...passiveOnlyIds]));
    }, []);

    useEffect(() => {
        syncHighlights(antennaIds, forwardFurniIds, selectionMode, furniSource);
    }, [antennaIds, forwardFurniIds, selectionMode, furniSource, syncHighlights]);

    const switchSelection = useCallback(
        (mode: SelectionMode) => {
            if (mode === selectionMode) return;
            if (mode === 'furni' && furniSource !== SOURCE_SELECTED) return;

            const nextAntennaIds = selectionMode === 'antenna' ? [...furniIds] : [...antennaIds];
            const nextForwardFurniIds = selectionMode === 'furni' ? [...furniIds] : [...forwardFurniIds];

            setAntennaIds(nextAntennaIds);
            setForwardFurniIds(nextForwardFurniIds);
            setSelectionMode(mode);
            if (setFurniIds) setFurniIds([...(mode === 'antenna' ? nextAntennaIds : nextForwardFurniIds)]);
        },
        [selectionMode, furniSource, furniIds, antennaIds, forwardFurniIds, setFurniIds]
    );

    const onChangeFurniSource = (next: number) => {
        const nextAntennaIds = selectionMode === 'antenna' ? [...furniIds] : [...antennaIds];

        setAntennaIds(nextAntennaIds);
        if (forwardFurniIds.length || selectionMode === 'furni') {
            setForwardFurniIds([]);
        }

        if (selectionMode === 'furni') {
            if (setFurniIds) setFurniIds([...nextAntennaIds]);
            setSelectionMode('antenna');
        }

        setFurniSource(next);
    };

    const save = useCallback(() => {
        const nextAntennaIds = selectionMode === 'antenna' ? [...furniIds] : [...antennaIds];
        const nextForwardFurniIds = selectionMode === 'furni' ? [...furniIds] : [...forwardFurniIds];

        setAntennaIds(nextAntennaIds);
        setForwardFurniIds(nextForwardFurniIds);

        if (selectionMode === 'furni') {
            setSelectionMode('antenna');
            if (setFurniIds) setFurniIds([...nextAntennaIds]);
        }

        const antennaSource = nextAntennaIds && nextAntennaIds.length ? nextAntennaIds[0] : 0;

        setIntParams([antennaSource, furniSource, userSource, signalPerFurni ? 1 : 0, signalPerUser ? 1 : 0, 0]);

        setStringParam(serializeForwardIds(nextForwardFurniIds));
    }, [
        selectionMode,
        furniIds,
        antennaIds,
        furniSource,
        userSource,
        signalPerFurni,
        signalPerUser,
        forwardFurniIds,
        setFurniIds,
        setIntParams,
        setStringParam
    ]);

    useEffect(() => {
        return () => {
            if (!highlightedIds.current.length) return;

            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
            highlightedIds.current = [];
        };
    }, []);

    const selectionLimit = trigger?.maximumItemSelectionCount ?? 0;

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID}
            cardStyle={{ width: '400px' }}
            save={save}
            selectionPreview={
                <div className="flex flex-col gap-2">
                    <WiredFurniSelectionSourceRow
                        title="Antenne:"
                        titleIsLiteral={true}
                        options={[{ value: SOURCE_SELECTED, label: 'wiredfurni.params.sources.furni.100' }]}
                        value={SOURCE_SELECTED}
                        selectionKind="primary"
                        selectionActive={selectionMode === 'antenna'}
                        selectionCount={antennaIds.length}
                        selectionLimit={selectionLimit}
                        selectionEnabledValues={[SOURCE_SELECTED]}
                        onChange={() => {}}
                        onSelectionActivate={() => switchSelection('antenna')}
                    />
                    <WiredFurniSelectionSourceRow
                        title="Furni da mandare avanti:"
                        titleIsLiteral={true}
                        options={FURNI_SOURCES}
                        value={furniSource}
                        selectionKind="secondary"
                        selectionActive={selectionMode === 'furni'}
                        selectionCount={forwardFurniIds.length}
                        selectionLimit={selectionLimit}
                        selectionEnabledValues={[SOURCE_SELECTED]}
                        onChange={onChangeFurniSource}
                        onSelectionActivate={() => switchSelection('furni')}
                    />
                    <WiredFurniSelectionSourceRow
                        title="Utenti da mandare avanti:"
                        titleIsLiteral={true}
                        options={USER_SOURCES}
                        value={userSource}
                        selectionKind="secondary"
                        selectionActive={false}
                        selectionCount={0}
                        selectionLimit={0}
                        selectionEnabledValues={[]}
                        showSelectionToggle={false}
                        onChange={setUserSource}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-3">
                <Text bold>{LocalizeText('wiredfurni.params.signal.options')}</Text>
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="signal-per-furni"
                        checked={signalPerFurni}
                        onChange={(e) => setSignalPerFurni(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="signal-per-furni">
                        <Text small>{LocalizeText('wiredfurni.params.signal.split_furni')}</Text>
                    </label>
                </div>
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="signal-per-user"
                        checked={signalPerUser}
                        onChange={(e) => setSignalPerUser(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="signal-per-user">
                        <Text small>{LocalizeText('wiredfurni.params.signal.split_users')}</Text>
                    </label>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
