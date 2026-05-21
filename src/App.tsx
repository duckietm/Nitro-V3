import { GetAssetManager, GetAvatarRenderManager, GetCommunication, GetConfiguration, GetLocalizationManager, GetRoomEngine, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, GetStage, GetTexturePool, GetTicker, HabboWebTools, LegacyExternalInterface, LoadGameUrlEvent, NitroEventType, NitroLogger, NitroVersion, PrepareRenderer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { ClearRememberLogin, GetRememberLogin, GetUIVersion, SetRememberLogin, StoreRememberLoginFromPayload, persistAccessTokenFromPayload } from './api';
import { Base } from './common';
import { LoadingView } from './components/loading/LoadingView';
import { LoginView } from './components/login/LoginView';
import { MainView } from './components/MainView';
import { ReconnectView } from './components/reconnect/ReconnectView';
import { useMessageEvent, useNitroEvent } from './hooks';

NitroVersion.UI_VERSION = GetUIVersion();

const getViewportDimensions = () =>
{
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.floor(viewport?.width ?? window.innerWidth));
    const height = Math.max(1, Math.floor(viewport?.height ?? window.innerHeight));

    return { width, height };
};

const syncViewportCssVars = () =>
{
    const { width, height } = getViewportDimensions();

    document.documentElement.style.setProperty('--nitro-app-width', `${ width }px`);
    document.documentElement.style.setProperty('--nitro-app-height', `${ height }px`);
};

const preloadUrl = async (url: string): Promise<void> =>
{
    if(!url) return;

    try
    {
        const response = await fetch(url, { cache: 'force-cache' });
        await response.arrayBuffer();
    }
    catch
    {}
};

const preloadImage = (url: string): void =>
{
    if(!url) return;

    try
    {
        const image = new Image();
        image.decoding = 'async';
        image.src = url;
    }
    catch
    {}
};

const asStringArray = (value: unknown): string[] =>
{
    if(Array.isArray(value)) return value.filter(item => typeof item === 'string');
    if(typeof value === 'string' && value.length) return [ value ];

    return [];
};

const hasRememberLogin = (): boolean => !!GetRememberLogin();

export const App: FC<{}> = props =>
{
    const [ isReady, setIsReady ] = useState(false);
    const [ errorMessage, setErrorMessage ] = useState('');
    const [ homeUrl, setHomeUrl ] = useState('');
    const [ showLogin, setShowLogin ] = useState(false);
    const [ isEnteringHotel, setIsEnteringHotel ] = useState(() => !!window.NitroConfig?.['sso.ticket'] || hasRememberLogin());
    const [ prepareTrigger, setPrepareTrigger ] = useState(0);
    const [ loadingProgress, setLoadingProgress ] = useState(0);
    const [ loadingTask, setLoadingTask ] = useState('');
    // Look up a loader-stage label from renderer-config so the strings the user
    // sees during the boot ("Sto caricando il guardaroba", "Connessione…") can
    // be translated by editing the JSON/JSON5 config — fallback keeps the
    // Italian baseline shipped with the client.
    const taskLabel = useCallback((key: string, fallback: string): string =>
    {
        try
        {
            const raw = GetConfiguration().getValue<string>(key, '');
            return (typeof raw === 'string' && raw.length) ? raw : fallback;
        }
        catch
        {
            return fallback;
        }
    }, []);
    const bumpProgress = useCallback((value: number, task?: string) =>
    {
        setLoadingProgress(prev => (value > prev ? value : prev));
        if(task !== undefined) setLoadingTask(task);
    }, []);
    const warmupPromiseRef = useRef<Promise<void>>(null);
    const rendererPromiseRef = useRef<Promise<any>>(null);
    const gameInitPromiseRef = useRef<Promise<void> | null>(null);
    const bootstrapDoneRef = useRef(false);
    const lastPrepareTriggerRef = useRef<number | null>(null);
    const tickersStartedRef = useRef(false);
    const heartbeatIntervalRef = useRef<number>(null);
    const rememberRotateIntervalRef = useRef<number>(null);
    const isReadyRef = useRef(false);
    const reconnectInProgressRef = useRef(false);

    const clearStoredCredentials = useCallback(() =>
    {
        ClearRememberLogin();
        try { delete (window as any).NitroConfig?.['sso.ticket']; } catch {}
        try { GetConfiguration().setValue('sso.ticket', ''); } catch {}
        // Drop `?sso=` from the URL too — otherwise the next reload re-applies
        // the same already-consumed ticket via bootstrap.ts and we loop right
        // back into "Session expired" without ever showing the login form.
        try
        {
            const url = new URL(window.location.href);

            if(url.searchParams.has('sso'))
            {
                url.searchParams.delete('sso');
                window.history.replaceState({}, '', url.toString());
            }
        }
        catch {}
    }, []);

    const showSessionExpired = useCallback(() =>
    {
        console.warn('[App] showSessionExpired — diagnostic shown (mid-game close)');
        clearStoredCredentials();

        const baseUrl = window.location.origin + '/';
        setHomeUrl(baseUrl);
        setErrorMessage('Your session has expired.\nPlease log in again to enter the hotel.');
        setIsReady(false);
        setShowLogin(false);
        setIsEnteringHotel(false);
    }, [ clearStoredCredentials ]);

    const fallbackToLogin = useCallback(() =>
    {
        // When login.screen.enabled is false this hotel uses SSO-only auth
        // (CMS issues the ticket and redirects here). Surfacing a login form
        // on init failure would just dump an empty/broken placeholder, since
        // the form's backgrounds and Turnstile aren't even configured. Send
        // the user back to the hotel home page instead.
        const rawLoginEnabled = GetConfiguration().getValue<unknown>('login.screen.enabled', false);
        const loginScreenEnabled = rawLoginEnabled === true || rawLoginEnabled === 'true' || rawLoginEnabled === 1;

        if(!loginScreenEnabled)
        {
            console.warn('[App] fallbackToLogin — login.screen.enabled=false, redirecting to home instead');
            showSessionExpired();
            return;
        }

        // Using console.warn (not NitroLogger.log) on purpose: NitroLogger
        // is gated on LOG_DEBUG, which only flips to true once startWarmup's
        // GetConfiguration().init() completes. Auth-failure paths fire before
        // that, so NitroLogger swallows their messages silently.
        console.warn('[App] fallbackToLogin — surfacing login form, credentials cleared');
        // Wipe whatever credential the server just rejected so the form is
        // pristine and the next attempt isn't sabotaged by the same stale data.
        clearStoredCredentials();
        setHomeUrl('');
        setErrorMessage('');
        setIsReady(false);
        setShowLogin(true);
        setIsEnteringHotel(false);
    }, [ clearStoredCredentials, showSessionExpired ]);

    const applySsoTicket = useCallback((ssoTicket: string) =>
    {
        if(!ssoTicket) return;
        window.NitroConfig['sso.ticket'] = ssoTicket;
        GetConfiguration().setValue('sso.ticket', ssoTicket);
    }, []);

    const handleAuthenticated = useCallback((ssoTicket: string) =>
    {
        if(!ssoTicket) return;
        applySsoTicket(ssoTicket);
        setIsEnteringHotel(true);
        setErrorMessage('');
        setPrepareTrigger(prev => prev + 1);
    }, [ applySsoTicket ]);

    const tryRememberLogin = useCallback(async (): Promise<string> =>
    {
        const remembered = GetRememberLogin();

        console.warn('[App] tryRememberLogin start', {
            hasRemembered: !!remembered,
            hasToken: !!remembered?.token?.length,
            hasStoredSso: !!remembered?.ssoTicket?.length
        });

        if(!remembered?.token?.length)
        {
            // No remember token means we'd be reusing a one-shot ssoTicket that
            // the server already consumed. Force the login screen instead.
            if(remembered) ClearRememberLogin();
            console.warn('[App] tryRememberLogin → no token, returning empty');
            return '';
        }

        try
        {
            const rawEndpoint = GetConfiguration().getValue<string>('login.remember.endpoint', '${api.url}/api/auth/remember');
            const endpoint = GetConfiguration().interpolate(rawEndpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'NitroRememberLogin'
                },
                body: JSON.stringify({ rememberToken: remembered.token })
            });

            let payload: Record<string, unknown> = {};
            try
            {
                payload = await response.json();
            }
            catch
            {}

            const ssoTicket = typeof payload.ssoTicket === 'string' ? payload.ssoTicket : (typeof payload.sso === 'string' ? payload.sso : '');

            console.warn('[App] tryRememberLogin → remember endpoint replied', {
                status: response.status,
                ok: response.ok,
                gotSsoTicket: !!ssoTicket
            });

            if(response.ok && ssoTicket)
            {
                persistAccessTokenFromPayload(payload);
                StoreRememberLoginFromPayload(payload, typeof payload.username === 'string' ? payload.username : remembered.username, ssoTicket);
                return ssoTicket;
            }
        }
        catch(error)
        {
            console.warn('[App] tryRememberLogin → fetch threw', error);
        }

        // Any failure (rejected token, bad payload, network error) — drop the
        // stored credentials. Never fall back to the cached ssoTicket: it's
        // one-shot and reusing it leads straight to "Session expired".
        ClearRememberLogin();
        console.warn('[App] tryRememberLogin → cleared remember, returning empty');

        return '';
    }, []);

    const rotateRememberLogin = useCallback(async (): Promise<void> =>
    {
        const remembered = GetRememberLogin();

        if(!remembered?.token?.length) return;

        try
        {
            const rawEndpoint = GetConfiguration().getValue<string>('login.refresh.endpoint', '${api.url}/api/auth/refresh');
            const endpoint = GetConfiguration().interpolate(rawEndpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'NitroRememberRotate'
                },
                body: JSON.stringify({ rememberToken: remembered.token })
            });

            let payload: Record<string, unknown> = {};
            try
            {
                payload = await response.json();
            }
            catch
            {}

            if(response.ok)
            {
                persistAccessTokenFromPayload(payload);
                StoreRememberLoginFromPayload(payload, remembered.username, remembered.ssoTicket);
                return;
            }

            if(response.status === 400 || response.status === 401 || response.status === 403) ClearRememberLogin();
        }
        catch(error)
        {
            NitroLogger.error('[LoginScreen] Remember rotation failed', error);
        }
    }, []);

    // Mirror isReady into a ref so the socket handlers below can read the
    // freshest value without needing to re-subscribe on every state change.
    useEffect(() => { isReadyRef.current = isReady; }, [ isReady ]);

    // Track whether a reconnect cycle is active. The renderer dispatches
    // SOCKET_RECONNECTING when it starts retrying after an abnormal close
    // (code != 1000/1001). On exhausted retries it fires SOCKET_RECONNECT_FAILED
    // *and* a final SOCKET_CLOSED — we keep the flag set through that pair
    // so ReconnectView's own overlay owns the UX and we don't double-render.
    useNitroEvent(NitroEventType.SOCKET_RECONNECTING, () => { reconnectInProgressRef.current = true; });
    useNitroEvent(NitroEventType.SOCKET_REAUTHENTICATED, () => { reconnectInProgressRef.current = false; });

    useNitroEvent(NitroEventType.SOCKET_CLOSED, () =>
    {
        // Three distinct close scenarios converge here:
        //
        //   1. !isReady — initial handshake just failed (server replied
        //      with "Bye" / code 1000 to a bad SSO ticket). The user never
        //      had a session. Surface the login form instead of the
        //      misleading "Session expired" diagnostic.
        //
        //   2. isReady && reconnect in progress — ReconnectView already
        //      owns the UX (its overlay shows attempts and the "Session
        //      expired" message on RECONNECT_FAILED). Stay out of its way.
        //
        //   3. isReady && no reconnect — instant server kick mid-game
        //      (code 1000 from the server side). No reconnect path will
        //      run. Show the legacy session-expired diagnostic so the
        //      user knows to reload.
        console.warn('[App] SOCKET_CLOSED fired', {
            isReady: isReadyRef.current,
            reconnectInProgress: reconnectInProgressRef.current
        });

        if(!isReadyRef.current)
        {
            console.warn('[App] Socket closed before authentication completed — falling back to login');
            fallbackToLogin();
            return;
        }

        if(reconnectInProgressRef.current) return;

        showSessionExpired();
    });

    useMessageEvent<LoadGameUrlEvent>(LoadGameUrlEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        LegacyExternalInterface.callGame('showGame', parser.url);
    });

    const startRenderer = useCallback((width: number, height: number) =>
    {
        if(rendererPromiseRef.current) return rendererPromiseRef.current;

        const rawUseBackBuffer = window.NitroConfig?.['renderer.useBackBuffer'];
        const useBackBuffer = (rawUseBackBuffer === undefined)
            ? true
            : ((rawUseBackBuffer === true) || (rawUseBackBuffer === 'true'));

        rendererPromiseRef.current = PrepareRenderer({
            width: Math.floor(width),
            height: Math.floor(height),
            resolution: window.devicePixelRatio,
            autoDensity: true,
            backgroundAlpha: 0,
            preference: 'webgl',
            eventMode: 'none',
            failIfMajorPerformanceCaveat: false,
            roundPixels: true,
            useBackBuffer
        });

        return rendererPromiseRef.current;
    }, []);

    const startWarmup = useCallback((width: number, height: number) =>
    {
        if(warmupPromiseRef.current) return warmupPromiseRef.current;

        warmupPromiseRef.current = (async () =>
        {
            await GetConfiguration().init();
            bumpProgress(25, taskLabel('loading.task.warmup', 'Caricamento contenuti...'));

            GetTicker().maxFPS = GetConfiguration().getValue<number>('system.fps.max', 24);
            NitroLogger.LOG_DEBUG = GetConfiguration().getValue<boolean>('system.log.debug', true);
            NitroLogger.LOG_WARN = GetConfiguration().getValue<boolean>('system.log.warn', false);
            NitroLogger.LOG_ERROR = GetConfiguration().getValue<boolean>('system.log.error', false);
            NitroLogger.LOG_EVENTS = GetConfiguration().getValue<boolean>('system.log.events', false);
            NitroLogger.LOG_PACKETS = GetConfiguration().getValue<boolean>('system.log.packets', false);

            startRenderer(width, height).catch(error => NitroLogger.error('[LoginScreen] Renderer warmup failed', error));

            const interpolate = (value: string) => GetConfiguration().interpolate(value);
            const assetUrls = asStringArray(GetConfiguration().getValue<unknown>('preload.assets.urls')).map(interpolate);
            const gamedataUrls = [
                ...asStringArray(GetConfiguration().getValue<unknown>('external.texts.url')).map(interpolate),
                ...[
                    'furnidata.url',
                    'productdata.url',
                    'avatar.actions.url',
                    'avatar.figuredata.url',
                    'avatar.figuremap.url',
                    'avatar.effectmap.url'
                ].map(key => interpolate(GetConfiguration().getValue<string>(key, ''))).filter(Boolean)
            ];
            const loginImages = ((GetConfiguration().getValue<Record<string, unknown>>('loginview', {})?.images) as Record<string, string>) ?? {};
            const loginImageUrls = [
                loginImages.background,
                loginImages.sun,
                loginImages.drape,
                loginImages.left,
                loginImages['right.repeat'],
                loginImages.right
            ].filter(Boolean).map(interpolate);

            loginImageUrls.forEach(preloadImage);
            gamedataUrls.forEach(url => preloadUrl(url));

            // Wire each warmup task to a progress bump so the bar reflects
            // real subsystem-init completion, not a fake timer. Range 25→70.
            // Each task carries a friendly label so the user sees what is
            // currently being prepared instead of raw file names.
            const warmupTasks: { promise: Promise<any>; label: string }[] = [
                { promise: GetAssetManager().downloadAssets(assetUrls), label: taskLabel('loading.task.assets', 'Sto caricando gli asset di gioco') },
                { promise: GetLocalizationManager().init(), label: taskLabel('loading.task.localization', 'Sto caricando le traduzioni') },
                { promise: GetAvatarRenderManager().init(), label: taskLabel('loading.task.avatar', 'Sto caricando il guardaroba') },
                { promise: GetSoundManager().init(), label: taskLabel('loading.task.sounds', 'Sto caricando i suoni') }
            ];
            let warmupDone = 0;
            const warmupStart = 25;
            const warmupSpan = 45;
            await Promise.all(warmupTasks.map(t => t.promise.then(value =>
            {
                warmupDone++;
                bumpProgress(warmupStart + Math.round((warmupSpan * warmupDone) / warmupTasks.length), t.label);
                return value;
            })));
        })();

        return warmupPromiseRef.current;
    }, [ startRenderer, bumpProgress, taskLabel ]);

    useEffect(() =>
    {
        syncViewportCssVars();

        const handleViewportResize = () => syncViewportCssVars();
        const viewport = window.visualViewport;

        window.addEventListener('resize', handleViewportResize);
        viewport?.addEventListener('resize', handleViewportResize);
        viewport?.addEventListener('scroll', handleViewportResize);

        return () =>
        {
            window.removeEventListener('resize', handleViewportResize);
            viewport?.removeEventListener('resize', handleViewportResize);
            viewport?.removeEventListener('scroll', handleViewportResize);
        };
    }, []);

    const onSessionExpired = useEffectEvent(() => showSessionExpired());
    const onInitFailure = useEffectEvent(() => fallbackToLogin());

    useEffect(() =>
    {
        const prepare = async (width: number, height: number) =>
        {
            // Don't dump the actual SSO ticket — it's a one-shot bearer
            // credential that grants access to the user's session, so
            // logging it in console.warn would leak it via copied logs
            // / screen shares / browser extension hooks. Boolean flag is
            // enough for the diagnostic.
            console.warn('[App] prepare() start', {
                hasNitroConfig: !!window.NitroConfig,
                ssoTicketInConfig: !!window.NitroConfig?.['sso.ticket'],
                hasRememberLocal: !!GetRememberLogin(),
                hasUrlSso: !!new URLSearchParams(window.location.search).get('sso')
            });

            const bootLabel = taskLabel('loading.task.boot', 'Avvio in corso...');
            setLoadingProgress(0);
            setLoadingTask(bootLabel);
            bumpProgress(5, bootLabel);

            try
            {
                if(!window.NitroConfig) throw new Error('NitroConfig is not defined!');

                let ssoTicket = window.NitroConfig['sso.ticket'];
                if(ssoTicket) GetConfiguration().setValue('sso.ticket', ssoTicket);

                // Cattura il remember-token passato via URL (?token=&token_exp=)
                // dal CMS Inertia /client e salvalo in localStorage. Serve a
                // tryRememberLogin() in reconnect: chiama POST /api/auth/remember
                // col token UUID, riceve un nuovo SSO ticket fresco invece di
                // riusare quello cleared da Arcturus dopo il primo consume.
                try
                {
                    const urlParams = new URLSearchParams(window.location.search);
                    const tokenParam = urlParams.get('token');
                    const tokenExpParam = urlParams.get('token_exp');
                    if(tokenParam && !GetRememberLogin())
                    {
                        const parsedExpiry = Number(tokenExpParam || 0);
                        const expiresAt = (Number.isFinite(parsedExpiry) && parsedExpiry > 0)
                            ? parsedExpiry
                            : Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
                        SetRememberLogin({ token: tokenParam, expiresAt });
                    }
                }
                catch(e)
                {
                    console.warn('[App] failed to persist remember token from URL', e);
                }

                bumpProgress(10, taskLabel('loading.task.session', 'Verifica sessione'));

                if(!ssoTicket || ssoTicket === '')
                {
                    // Configuration is loaded lazily — fetch it up-front so the login
                    // screen toggle and Turnstile keys are available before we decide.
                    let configInitError: unknown = null;
                    try
                    {
                        await GetConfiguration().init();
                    }
                    catch(e)
                    {
                        configInitError = e;
                    }

                    const rawLoginEnabled = GetConfiguration().getValue<unknown>('login.screen.enabled', false);
                    const loginScreenEnabled = rawLoginEnabled === true || rawLoginEnabled === 'true' || rawLoginEnabled === 1;

                    console.warn('[App] no SSO path — login gate', {
                        configInitError: configInitError ? String((configInitError as Error)?.message ?? configInitError) : null,
                        rawLoginEnabled,
                        rawLoginEnabledType: typeof rawLoginEnabled,
                        loginScreenEnabled
                    });

                    if(configInitError)
                    {
                        NitroLogger.error('[LoginScreen] Failed to load renderer-config.json — cannot resolve login.screen.enabled', configInitError);
                    }

                    if(loginScreenEnabled)
                    {
                        const rememberedSsoTicket = await tryRememberLogin();

                        if(rememberedSsoTicket)
                        {
                            ssoTicket = rememberedSsoTicket;
                            applySsoTicket(rememberedSsoTicket);
                            setShowLogin(false);
                        }
                        else
                        {
                            setIsReady(false);
                            setShowLogin(true);
                            startWarmup(width, height).catch(error => NitroLogger.error('[LoginScreen] Warmup failed', error));
                            return;
                        }
                    }
                    else
                    {
                        if(configInitError)
                        {
                            setHomeUrl(window.location.origin + '/');
                            setErrorMessage(`Unable to load renderer-config.json.\n${ String((configInitError as Error)?.message ?? configInitError) }`);
                            setIsReady(false);
                            setShowLogin(false);
                            setIsEnteringHotel(false);
                            return;
                        }

                        onSessionExpired();
                        return;
                    }
                }

                const renderer = await startRenderer(width, height);
                bumpProgress(20, taskLabel('loading.task.renderer', 'Inizializzazione renderer'));

                await startWarmup(width, height);
                bumpProgress(70, taskLabel('loading.task.startsession', 'Avvio sessione'));

                if(!gameInitPromiseRef.current)
                {
                    gameInitPromiseRef.current = (async () =>
                    {
                        await GetSessionDataManager().init();
                        bumpProgress(78, taskLabel('loading.task.userdata', 'Caricamento dati utente'));
                        await GetRoomSessionManager().init();
                        bumpProgress(85, taskLabel('loading.task.rooms', 'Caricamento stanze'));
                        await GetRoomEngine().init();
                        bumpProgress(92, taskLabel('loading.task.engine', 'Caricamento engine grafico'));
                        await GetCommunication().init();
                        bumpProgress(98, taskLabel('loading.task.connect', 'Connessione al server'));
                    })();
                }

                await gameInitPromiseRef.current;

                if(!bootstrapDoneRef.current)
                {
                    bootstrapDoneRef.current = true;
                    if(LegacyExternalInterface.available) LegacyExternalInterface.call('legacyTrack', 'authentication', 'authok', []);
                    HabboWebTools.sendHeartBeat();
                }

                if(heartbeatIntervalRef.current !== null) window.clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = window.setInterval(() => HabboWebTools.sendHeartBeat(), 10000);

                if(rememberRotateIntervalRef.current !== null) window.clearInterval(rememberRotateIntervalRef.current);

                const rotateMinutes = Math.max(1, Number(GetConfiguration().getValue<unknown>('login.remember.rotate.interval.minutes', 15)) || 15);
                if(GetRememberLogin()?.token?.length) rememberRotateIntervalRef.current = window.setInterval(() => rotateRememberLogin(), rotateMinutes * 60 * 1000);

                if(!tickersStartedRef.current)
                {
                    tickersStartedRef.current = true;
                    GetTicker().add(ticker => GetRoomEngine().update(ticker));
                    GetTicker().add(ticker => renderer.render(GetStage()));
                    GetTicker().add(ticker => GetTexturePool().run());
                }

                bumpProgress(100, taskLabel('loading.task.ready', 'Pronto!'));
                setIsReady(true);
                setShowLogin(false);
                setIsEnteringHotel(false);
            }
            catch(err)
            {
                NitroLogger.error('[App] Initialization failed — falling back to login', err);
                // Anything thrown out of the post-auth chain (renderer init,
                // asset download, GetCommunication().init()) is an init/connect
                // failure, not session expiration. The credential we used is
                // suspect — drop it and present the login form so the user
                // can retry instead of getting stuck on a stale "Session expired".
                onInitFailure();
            }
        };

        // React Strict Mode in dev runs every effect twice (mount → cleanup → mount).
        // `prepare()` is full of one-shot side effects (renderer init, websocket
        // connect, NitroConfig mutation) — calling it twice with the same trigger
        // value causes the second pass to race with the first and clobber state
        // (e.g. the second pass falls through to onSessionExpired while the first
        // had just set showLogin=true). Guard by trigger value: skip duplicate
        // runs at the same trigger, but still re-run when handleAuthenticated
        // bumps prepareTrigger after a successful login.
        if(lastPrepareTriggerRef.current === prepareTrigger) return;
        lastPrepareTriggerRef.current = prepareTrigger;

        const { width, height } = getViewportDimensions();

        prepare(width, height);

        return () =>
        {
            if(heartbeatIntervalRef.current !== null) window.clearInterval(heartbeatIntervalRef.current);
            if(rememberRotateIntervalRef.current !== null) window.clearInterval(rememberRotateIntervalRef.current);
        };
    }, [ prepareTrigger, startWarmup, startRenderer, tryRememberLogin, applySsoTicket, rotateRememberLogin, bumpProgress, taskLabel ]);

    return (
        <Base fit overflow="hidden" className={ `nitro-app-root ${ !(window.devicePixelRatio % 1) ? 'image-rendering-pixelated' : '' }` }>
            { !isReady && !showLogin &&
                <LoadingView isError={ errorMessage.length > 0 } message={ errorMessage } homeUrl={ homeUrl } progress={ loadingProgress } currentTask={ loadingTask } /> }
            { !isReady && showLogin && <LoginView onAuthenticated={ handleAuthenticated } isEntering={ isEnteringHotel } /> }
            { isReady && <MainView /> }
            { /* Reconnect overlay must NOT render before we've actually entered
                 the hotel — otherwise the renderer's auto-retry on an initial
                 handshake failure (e.g. emulator unreachable) would cover the
                 login form with "Reconnecting..." → "Session expired" and the
                 user wouldn't be able to interact with the form we just put up
                 via fallbackToLogin. */ }
            { isReady && <ReconnectView /> }
            <Base id="draggable-windows-container" />
        </Base>
    );
};
