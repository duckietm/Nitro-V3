import { GetAssetManager, GetAvatarRenderManager, GetCommunication, GetConfiguration, GetLocalizationManager, GetRoomEngine, GetRoomSessionManager, GetSessionDataManager, GetSoundManager, GetStage, GetTexturePool, GetTicker, HabboWebTools, LegacyExternalInterface, LoadGameUrlEvent, NitroEventType, NitroLogger, NitroVersion, PrepareRenderer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { GetUIVersion } from './api';
import { Base } from './common';
import { LoadingView } from './components/loading/LoadingView';
import { LoginView } from './components/login/LoginView';
import { MainView } from './components/MainView';
import { ReconnectView } from './components/reconnect/ReconnectView';
import { useMessageEvent, useNitroEvent } from './hooks';

NitroVersion.UI_VERSION = GetUIVersion();

export const App: FC<{}> = props =>
{
    const [ isReady, setIsReady ] = useState(false);
    const [ errorMessage, setErrorMessage ] = useState('');
    const [ homeUrl, setHomeUrl ] = useState('');
    const [ showLogin, setShowLogin ] = useState(false);
    const [ prepareTrigger, setPrepareTrigger ] = useState(0);
    const showSessionExpired = useCallback(() =>
    {
        const baseUrl = window.location.origin + '/';
        setHomeUrl(baseUrl);
        setErrorMessage('Your session has expired.\nPlease log in again to enter the hotel.');
        setIsReady(false);
        setShowLogin(false);
    }, []);

    const handleAuthenticated = useCallback((ssoTicket: string) =>
    {
        if(!ssoTicket) return;
        window.NitroConfig['sso.ticket'] = ssoTicket;
        setShowLogin(false);
        setErrorMessage('');
        setPrepareTrigger(prev => prev + 1);
    }, []);

    useNitroEvent(NitroEventType.SOCKET_CLOSED, showSessionExpired);

    useMessageEvent<LoadGameUrlEvent>(LoadGameUrlEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        LegacyExternalInterface.callGame('showGame', parser.url);
    });

    useEffect(() =>
    {
        let heartbeatInterval: number = null;
        let rememberRotateInterval: number = null;

        const prepare = async (width: number, height: number) =>
        {
            try
            {
                if(!window.NitroConfig) throw new Error('NitroConfig is not defined!');

                let ssoTicket = window.NitroConfig['sso.ticket'];
                let configInitError: unknown = null;

                if(!ssoTicket || ssoTicket === '')
                {
                    try { await GetConfiguration().init(); }
                    catch(e) { configInitError = e; }

                    if(configInitError)
                    {
                        NitroLogger.error('[LoginScreen] Failed to load renderer-config.json — cannot resolve login.screen.enabled', configInitError);
                    }

                    if(!configInitError)
                    {
                        let storedRemember: string | null = null;
                        try { storedRemember = window.localStorage.getItem('nitro.remember.token'); }
                        catch {}

                        if(storedRemember)
                        {
                            const rememberUrlTemplate = GetConfiguration().getValue<string>('login.remember.endpoint', '/api/auth/remember');
                            const rememberUrl = GetConfiguration().interpolate(rememberUrlTemplate);
                            try
                            {
                                const response = await fetch(rememberUrl, {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json',
                                        'X-Requested-With': 'NitroRememberMe'
                                    },
                                    body: JSON.stringify({ rememberToken: storedRemember })
                                });
                                if(response.ok)
                                {
                                    const payload = await response.json();
                                    const ticket = typeof payload.ssoTicket === 'string' ? payload.ssoTicket : '';
                                    if(ticket)
                                    {
                                        window.NitroConfig['sso.ticket'] = ticket;
                                        ssoTicket = ticket;
                                        try
                                        {
                                            if(typeof payload.rememberToken === 'string' && payload.rememberToken.length)
                                                window.localStorage.setItem('nitro.remember.token', payload.rememberToken);
                                        }
                                        catch {}
                                    }
                                }
                                else if(response.status === 401)
                                {
                                    try { window.localStorage.removeItem('nitro.remember.token'); } catch {}
                                }
                            }
                            catch {}
                        }
                    }
                }

                if(!ssoTicket || ssoTicket === '')
                {
                    const rawLoginEnabled = GetConfiguration().getValue<unknown>('login.screen.enabled', false);
                    const loginScreenEnabled = rawLoginEnabled === true || rawLoginEnabled === 'true' || rawLoginEnabled === 1;

                    if(loginScreenEnabled)
                    {
                        try { await GetLocalizationManager().init(); }
                        catch(localizationErr) { NitroLogger.error('[LoginScreen] Localization init failed', localizationErr); }

                        setIsReady(false);
                        setShowLogin(true);
                        return;
                    }

                    if(configInitError)
                    {
                        setHomeUrl(window.location.origin + '/');
                        setErrorMessage(`Unable to load renderer-config.json.\n${ String((configInitError as Error)?.message ?? configInitError) }`);
                        setIsReady(false);
                        setShowLogin(false);
                        return;
                    }

                    showSessionExpired();
                    return;
                }

                const rawUseBackBuffer = window.NitroConfig['renderer.useBackBuffer'];
                const useBackBuffer = (rawUseBackBuffer === undefined)
                    ? true
                    : ((rawUseBackBuffer === true) || (rawUseBackBuffer === 'true'));

                const renderer = await PrepareRenderer({
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

                await GetConfiguration().init();

                GetTicker().maxFPS = GetConfiguration().getValue<number>('system.fps.max', 24);
                NitroLogger.LOG_DEBUG = GetConfiguration().getValue<boolean>('system.log.debug', true);
                NitroLogger.LOG_WARN = GetConfiguration().getValue<boolean>('system.log.warn', false);
                NitroLogger.LOG_ERROR = GetConfiguration().getValue<boolean>('system.log.error', false);
                NitroLogger.LOG_EVENTS = GetConfiguration().getValue<boolean>('system.log.events', false);
                NitroLogger.LOG_PACKETS = GetConfiguration().getValue<boolean>('system.log.packets', false);

                const assetUrls = GetConfiguration().getValue<string[]>('preload.assets.urls').map(url => GetConfiguration().interpolate(url)) ?? [];

                await Promise.all(
                    [
                        GetAssetManager().downloadAssets(assetUrls),
                        GetLocalizationManager().init(),
                        GetAvatarRenderManager().init(),
                        GetSoundManager().init(),
                        GetSessionDataManager().init(),
                        GetRoomSessionManager().init()
                    ]
                );

                await GetRoomEngine().init();
                await GetCommunication().init();

                if(LegacyExternalInterface.available) LegacyExternalInterface.call('legacyTrack', 'authentication', 'authok', []);

                HabboWebTools.sendHeartBeat();

                heartbeatInterval = window.setInterval(() => HabboWebTools.sendHeartBeat(), 10000);

                const rotateMinutes = Math.max(1, Number(GetConfiguration().getValue<unknown>('login.remember.rotate.interval.minutes', 15)) || 15);
                const refreshUrlTemplate = GetConfiguration().getValue<string>('login.refresh.endpoint', '/api/auth/refresh');
                const refreshUrl = GetConfiguration().interpolate(refreshUrlTemplate);
                const rotateRemember = async () =>
                {
                    let stored: string = null;
                    try { stored = window.localStorage.getItem('nitro.remember.token'); }
                    catch { return; }
                    if(!stored) return;
                    try
                    {
                        const resp = await fetch(refreshUrl, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'NitroRememberRotate' },
                            body: JSON.stringify({ rememberToken: stored })
                        });
                        if(resp.ok)
                        {
                            const payload = await resp.json();
                            if(typeof payload.rememberToken === 'string' && payload.rememberToken.length)
                            {
                                try { window.localStorage.setItem('nitro.remember.token', payload.rememberToken); } catch {}
                            }
                        }
                        else if(resp.status === 401)
                        {
                            try { window.localStorage.removeItem('nitro.remember.token'); } catch {}
                        }
                    }
                    catch {}
                };
                rememberRotateInterval = window.setInterval(rotateRemember, rotateMinutes * 60 * 1000);

                GetTicker().add(ticker => GetRoomEngine().update(ticker));
                GetTicker().add(ticker => renderer.render(GetStage()));
                GetTicker().add(ticker => GetTexturePool().run());

                setIsReady(true);
            }
            catch(err)
            {
                NitroLogger.error(err);
                showSessionExpired();
            }
        };

        prepare(window.innerWidth, window.innerHeight);

        return () =>
        {
            if(heartbeatInterval !== null) window.clearInterval(heartbeatInterval);
            if(rememberRotateInterval !== null) window.clearInterval(rememberRotateInterval);
        };
    }, [ prepareTrigger ]);

    return (
        <Base fit overflow="hidden" className={ !(window.devicePixelRatio % 1) && 'image-rendering-pixelated' }>
            { !isReady && !showLogin &&
                <LoadingView isError={ errorMessage.length > 0 } message={ errorMessage } homeUrl={ homeUrl } /> }
            { !isReady && showLogin && <LoginView onAuthenticated={ handleAuthenticated } /> }
            { isReady && <MainView /> }
            <ReconnectView />
            <Base id="draggable-windows-container" />
        </Base>
    );
};
