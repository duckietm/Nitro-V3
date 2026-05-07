import { GetAssetManager, GetAvatarRenderManager, GetCommunication, GetConfiguration, GetLocalizationManager, GetRoomEngine, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, GetStage, GetTexturePool, GetTicker, HabboWebTools, LegacyExternalInterface, LoadGameUrlEvent, NitroEventType, NitroLogger, NitroVersion, PrepareRenderer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { ClearRememberLogin, GetRememberLogin, GetUIVersion, StoreRememberLoginFromPayload } from './api';
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
    catch {}
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
    catch {}
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
    const [ showLogin, setShowLogin ] = useState(() => !window.NitroConfig?.['sso.ticket'] && !hasRememberLogin());
    const [ isEnteringHotel, setIsEnteringHotel ] = useState(() => !!window.NitroConfig?.['sso.ticket'] || hasRememberLogin());
    const [ prepareTrigger, setPrepareTrigger ] = useState(0);
    const warmupPromiseRef = useRef<Promise<void>>(null);
    const rendererPromiseRef = useRef<Promise<any>>(null);
    const tickersStartedRef = useRef(false);
    const heartbeatIntervalRef = useRef<number>(null);
    const rememberRotateIntervalRef = useRef<number>(null);
    const showSessionExpired = useCallback(() =>
    {
        const baseUrl = window.location.origin + '/';
        setHomeUrl(baseUrl);
        setErrorMessage('Your session has expired.\nPlease log in again to enter the hotel.');
        setIsReady(false);
        setShowLogin(false);
        setIsEnteringHotel(false);
    }, []);

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

        if(!remembered) return '';
        if(!remembered.token?.length && remembered.ssoTicket?.length) return remembered.ssoTicket;

        let allowSsoFallback = true;

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
            try { payload = await response.json(); }
            catch {}

            const ssoTicket = typeof payload.ssoTicket === 'string' ? payload.ssoTicket : (typeof payload.sso === 'string' ? payload.sso : '');

            if(response.ok && ssoTicket)
            {
                StoreRememberLoginFromPayload(payload, typeof payload.username === 'string' ? payload.username : remembered.username, ssoTicket);
                return ssoTicket;
            }

            if(response.status === 400 || response.status === 401 || response.status === 403)
            {
                allowSsoFallback = false;
                ClearRememberLogin();
            }
        }
        catch(error)
        {
            NitroLogger.error('[LoginScreen] Remember login failed', error);
        }

        if(allowSsoFallback && remembered.ssoTicket?.length) return remembered.ssoTicket;

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
            try { payload = await response.json(); }
            catch {}

            if(response.ok)
            {
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

    // Listen for socket closed events (code 1000 "Bye" - server rejected SSO)
    useNitroEvent(NitroEventType.SOCKET_CLOSED, showSessionExpired);

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

            await Promise.all(
                [
                    GetAssetManager().downloadAssets(assetUrls),
                    GetLocalizationManager().init(),
                    GetAvatarRenderManager().init(),
                    GetSoundManager().init()
                ]
            );
        })();

        return warmupPromiseRef.current;
    }, [ startRenderer ]);

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

    useEffect(() =>
    {
        const prepare = async (width: number, height: number) =>
        {
            try
            {
                if(!window.NitroConfig) throw new Error('NitroConfig is not defined!');

                let ssoTicket = window.NitroConfig['sso.ticket'];
                if(ssoTicket) GetConfiguration().setValue('sso.ticket', ssoTicket);

                if(!ssoTicket || ssoTicket === '')
                {
                    // Configuration is loaded lazily — fetch it up-front so the login
                    // screen toggle and Turnstile keys are available before we decide.
                    let configInitError: unknown = null;
                    try { await GetConfiguration().init(); }
                    catch(e) { configInitError = e; }

                    const rawLoginEnabled = GetConfiguration().getValue<unknown>('login.screen.enabled', false);
                    const loginScreenEnabled = rawLoginEnabled === true || rawLoginEnabled === 'true' || rawLoginEnabled === 1;

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

                        showSessionExpired();
                        return;
                    }
                }

                const renderer = await startRenderer(width, height);

                await startWarmup(width, height);
                await GetSessionDataManager().init();
                await GetRoomSessionManager().init();
                await GetRoomEngine().init();
                await GetCommunication().init();

                if(LegacyExternalInterface.available) LegacyExternalInterface.call('legacyTrack', 'authentication', 'authok', []);

                HabboWebTools.sendHeartBeat();

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

                setIsReady(true);
                setShowLogin(false);
                setIsEnteringHotel(false);
            }
            catch(err)
            {
                NitroLogger.error(err);
                setIsEnteringHotel(false);
                showSessionExpired();
            }
        };

        const { width, height } = getViewportDimensions();

        prepare(width, height);

        return () =>
        {
            if(heartbeatIntervalRef.current !== null) window.clearInterval(heartbeatIntervalRef.current);
            if(rememberRotateIntervalRef.current !== null) window.clearInterval(rememberRotateIntervalRef.current);
        };
    }, [ prepareTrigger, startWarmup, startRenderer, tryRememberLogin, applySsoTicket, rotateRememberLogin ]);

    return (
        <Base fit overflow="hidden" className={ `nitro-app-root ${ !(window.devicePixelRatio % 1) ? 'image-rendering-pixelated' : '' }` }>
            { !isReady && !showLogin &&
                <LoadingView isError={ errorMessage.length > 0 } message={ errorMessage } homeUrl={ homeUrl } /> }
            { !isReady && showLogin && <LoginView onAuthenticated={ handleAuthenticated } isEntering={ isEnteringHotel } /> }
            { isReady && <MainView /> }
            <ReconnectView />
            <Base id="draggable-windows-container" />
        </Base>
    );
};
