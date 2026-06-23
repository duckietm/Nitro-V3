import { RoomSessionDoorbellEvent } from '@nitrots/nitro-renderer';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNitroEvent } from '../../events';

/**
 * Reduces the three doorbell events (DOORBELL, RSDE_ACCEPTED, RSDE_REJECTED)
 * into a single users array. Data-only hook split — actions live in
 * useDoorbellActions.
 */
export const useDoorbellState = (): readonly string[] => {
    const [users, setUsers] = useState<string[]>([]);

    const usersRef = useRef(users);

    useLayoutEffect(() => {
        usersRef.current = users;
    });

    const handleAdd = useCallback((event: RoomSessionDoorbellEvent) => {
        if (usersRef.current.indexOf(event.userName) >= 0) return;

        setUsers([...usersRef.current, event.userName]);
    }, []);

    const handleRemove = useCallback((event: RoomSessionDoorbellEvent) => {
        const index = usersRef.current.indexOf(event.userName);

        if (index === -1) return;

        const next = [...usersRef.current];
        next.splice(index, 1);
        setUsers(next);
    }, []);

    useNitroEvent<RoomSessionDoorbellEvent>(RoomSessionDoorbellEvent.DOORBELL, handleAdd);
    useNitroEvent<RoomSessionDoorbellEvent>(RoomSessionDoorbellEvent.RSDE_ACCEPTED, handleRemove);
    useNitroEvent<RoomSessionDoorbellEvent>(RoomSessionDoorbellEvent.RSDE_REJECTED, handleRemove);

    return users;
};
