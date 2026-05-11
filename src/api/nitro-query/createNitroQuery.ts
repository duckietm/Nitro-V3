/**
 * Adapter prototype for proposal #2 (server requests as queries).
 *
 * NOT YET ENABLED — `@tanstack/react-query` is not in package.json.
 * To activate:
 *
 *   yarn add @tanstack/react-query @tanstack/react-query-devtools
 *
 * Then mount the provider once in `src/index.tsx`:
 *
 *   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 *   const queryClient = new QueryClient({
 *       defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
 *   });
 *   <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
 *
 * Then this file becomes:
 *
 *   import { useQuery } from '@tanstack/react-query';
 *   ...
 *
 * The interface below shows the intended API. Once enabled, replace the
 * placeholder bodies with the real `useQuery` calls.
 */

import { IMessageEvent, MessageEvent } from '@nitrots/nitro-renderer';
import { SendMessageComposer } from '../SendMessageComposer';

export interface NitroQueryConfig<TParser extends IMessageEvent, TData>
{
    /**
     * Stable key used for caching/deduping (TanStack Query queryKey).
     * Convention: ['nitro', '<domain>', '<request>', ...args].
     */
    key: readonly unknown[];
    /**
     * Factory for the request composer. Called once per query execution.
     */
    request: () => any;
    /**
     * The parser class to listen for as the response.
     */
    parser: typeof MessageEvent;
    /**
     * Maps the parser event to the data the component cares about.
     */
    select?: (event: TParser) => TData;
    /**
     * Optional max time to wait for the response before failing.
     */
    timeoutMs?: number;
}

/**
 * Build a one-shot Promise that sends a composer and resolves with the
 * matching parser event. To be passed into TanStack Query's queryFn:
 *
 *   useQuery({
 *       queryKey: cfg.key,
 *       queryFn: () => awaitNitroResponse(cfg),
 *   });
 *
 * Implementation outline (filled in once react-query is added):
 *
 *   return new Promise<TData>((resolve, reject) => {
 *       const event = new cfg.parser((e: TParser) => {
 *           GetCommunication().removeMessageEvent(event);
 *           resolve(cfg.select ? cfg.select(e) : (e as unknown as TData));
 *       });
 *       GetCommunication().registerMessageEvent(event);
 *       SendMessageComposer(cfg.request());
 *       if (cfg.timeoutMs) setTimeout(() => {
 *           GetCommunication().removeMessageEvent(event);
 *           reject(new Error('NitroQuery timeout'));
 *       }, cfg.timeoutMs);
 *   });
 */
export const awaitNitroResponse = <TParser extends IMessageEvent, TData>(
    _cfg: NitroQueryConfig<TParser, TData>
): Promise<TData> =>
{
    void SendMessageComposer;
    throw new Error('useNitroQuery is not enabled. See docs/ARCHITECTURE.md proposal #2.');
};
