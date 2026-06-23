import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourceOption, WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const SOURCE_ALL_ROOM = 900;
const DEFAULT_SOURCE = 0;

const FURNI_SOURCES: WiredSourceOption[] = [
    { value: SOURCE_ALL_ROOM, label: 'wiredfurni.params.sources.furni.900' },
    { value: 0, label: 'wiredfurni.params.sources.furni.0' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' },
    { value: 201, label: 'wiredfurni.params.sources.furni.201' }
];

const USER_SOURCES: WiredSourceOption[] = [
    { value: SOURCE_ALL_ROOM, label: 'wiredfurni.params.sources.users.900' },
    { value: 0, label: 'wiredfurni.params.sources.users.0' },
    { value: 200, label: 'wiredfurni.params.sources.users.200' },
    { value: 201, label: 'wiredfurni.params.sources.users.201' }
];

const normalizeSource = (value: number, options: WiredSourceOption[]) => (options.some((option) => option.value === value) ? value : DEFAULT_SOURCE);
const getFlag = (value: number) => value === 1;

export const WiredExtraMovePhysicsView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [keepAltitude, setKeepAltitude] = useState(false);
    const [moveThroughFurni, setMoveThroughFurni] = useState(false);
    const [moveThroughUsers, setMoveThroughUsers] = useState(false);
    const [blockByFurni, setBlockByFurni] = useState(false);
    const [moveThroughFurniSource, setMoveThroughFurniSource] = useState(DEFAULT_SOURCE);
    const [blockByFurniSource, setBlockByFurniSource] = useState(DEFAULT_SOURCE);
    const [moveThroughUsersSource, setMoveThroughUsersSource] = useState(DEFAULT_SOURCE);

    useEffect(() => {
        if (!trigger) return;

        setKeepAltitude(getFlag(trigger.intData[0] ?? 0));
        setMoveThroughFurni(getFlag(trigger.intData[1] ?? 0));
        setMoveThroughUsers(getFlag(trigger.intData[2] ?? 0));
        setBlockByFurni(getFlag(trigger.intData[3] ?? 0));
        setMoveThroughFurniSource(normalizeSource(trigger.intData[4] ?? DEFAULT_SOURCE, FURNI_SOURCES));
        setBlockByFurniSource(normalizeSource(trigger.intData[5] ?? DEFAULT_SOURCE, FURNI_SOURCES));
        setMoveThroughUsersSource(normalizeSource(trigger.intData[6] ?? DEFAULT_SOURCE, USER_SOURCES));
    }, [trigger]);

    const save = () => {
        setIntParams([
            keepAltitude ? 1 : 0,
            moveThroughFurni ? 1 : 0,
            moveThroughUsers ? 1 : 0,
            blockByFurni ? 1 : 0,
            normalizeSource(moveThroughFurniSource, FURNI_SOURCES),
            normalizeSource(blockByFurniSource, FURNI_SOURCES),
            normalizeSource(moveThroughUsersSource, USER_SOURCES)
        ]);
        setStringParam('');
    };

    const footer = useMemo(() => {
        if (!moveThroughFurni && !blockByFurni && !moveThroughUsers) return null;

        return (
            <div className="flex flex-col gap-3">
                {moveThroughFurni && (
                    <WiredSourcesSelector
                        showFurni={true}
                        furniSource={moveThroughFurniSource}
                        furniSources={FURNI_SOURCES}
                        furniTitle="wiredfurni.params.sources.furni.title.physics.0"
                        onChangeFurni={(value) => setMoveThroughFurniSource(normalizeSource(value, FURNI_SOURCES))}
                    />
                )}
                {blockByFurni && (
                    <WiredSourcesSelector
                        showFurni={true}
                        furniSource={blockByFurniSource}
                        furniSources={FURNI_SOURCES}
                        furniTitle="wiredfurni.params.sources.furni.title.physics.1"
                        onChangeFurni={(value) => setBlockByFurniSource(normalizeSource(value, FURNI_SOURCES))}
                    />
                )}
                {moveThroughUsers && (
                    <WiredSourcesSelector
                        showUsers={true}
                        userSource={moveThroughUsersSource}
                        userSources={USER_SOURCES}
                        usersTitle="wiredfurni.params.sources.users.title.physics.0"
                        allowClickedUserSource={false}
                        onChangeUsers={(value) => setMoveThroughUsersSource(normalizeSource(value, USER_SOURCES))}
                    />
                )}
            </div>
        );
    }, [blockByFurni, blockByFurniSource, moveThroughFurni, moveThroughFurniSource, moveThroughUsers, moveThroughUsersSource]);

    return (
        <WiredExtraBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE}
            save={save}
            cardStyle={{ width: 430 }}
            footer={footer}
        >
            <div className="flex flex-col gap-2">
                <Text bold>{LocalizeText('wiredfurni.params.select_options')}</Text>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input checked={keepAltitude} className="form-check-input" type="checkbox" onChange={(event) => setKeepAltitude(event.target.checked)} />
                    <Text>{LocalizeText('wiredfurni.params.movephysics.keep_altitude')}</Text>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        checked={moveThroughFurni}
                        className="form-check-input"
                        type="checkbox"
                        onChange={(event) => setMoveThroughFurni(event.target.checked)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.movephysics.move_through_furni')}</Text>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        checked={moveThroughUsers}
                        className="form-check-input"
                        type="checkbox"
                        onChange={(event) => setMoveThroughUsers(event.target.checked)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.movephysics.move_through_users')}</Text>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input checked={blockByFurni} className="form-check-input" type="checkbox" onChange={(event) => setBlockByFurni(event.target.checked)} />
                    <Text>{LocalizeText('wiredfurni.params.movephysics.block_by_furni')}</Text>
                </label>
            </div>
        </WiredExtraBaseView>
    );
};
