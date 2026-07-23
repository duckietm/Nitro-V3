import { GetCommunication, IConnectionStateSnapshot, NitroEventType } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { useNitroEvent } from './useNitroEvent';

const readConnectionState = (): Readonly<IConnectionStateSnapshot> => GetCommunication().connection.connectionState;

export const useConnectionState = (): Readonly<IConnectionStateSnapshot> => {
    const [snapshot, setSnapshot] = useState(readConnectionState);
    const refresh = useCallback(() => setSnapshot(readConnectionState()), []);

    useNitroEvent(NitroEventType.CONNECTION_STATE_CHANGED, refresh);

    return snapshot;
};
