import { NitroEvent } from '@nitrots/nitro-renderer';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNitroEvent } from './useNitroEvent';

/**
 * Subscribe to a Nitro renderer event and expose the latest derived value
 * as React state. Replaces the boilerplate pattern:
 *
 *   const [foo, setFoo] = useState(initial);
 *   useNitroEvent(EVENT, e => setFoo(selector(e)));
 *
 * with:
 *
 *   const foo = useNitroEventState(EVENT, selector, initial);
 *
 * The selector closure is captured in a ref refreshed in commit, so
 * a new selector identity per render does not re-subscribe the listener.
 */
export const useNitroEventState = <T extends NitroEvent, S>(
    type: string | string[],
    selector: (event: T) => S,
    initial: S | (() => S),
    enabled: boolean = true
): S =>
{
    const [ value, setValue ] = useState<S>(initial);
    const selectorRef = useRef(selector);

    useLayoutEffect(() =>
    {
        selectorRef.current = selector;
    });

    const handler = useCallback((event: T) =>
    {
        setValue(selectorRef.current(event));
    }, []);

    useNitroEvent<T>(type, handler, enabled);

    return value;
};
