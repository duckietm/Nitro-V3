import { getClientMode, installSecureFetch, secureUrl } from './secure-assets';

const ensureMobileViewport = () =>
{
    let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

    if(!viewport)
    {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }

    viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
};

ensureMobileViewport();
installSecureFetch();

const setBootDebug = (message: string) =>
{
    try
    {
        (window as any).__nitroBootDebug = message;
        const secureNode = document.getElementById('nitro-secure-debug');

        if(secureNode) secureNode.textContent = `${ secureNode.textContent }\n${ message }`;
    }
    catch {}
};

setBootDebug('boot: secure fetch installed');

const loadClientMode = async () =>
{
    try
    {
        if((window as any).__nitroClientMode) return;

        const url = new URL('configuration/client-mode.json', `${ window.location.origin }/`);
        url.searchParams.set('v', Date.now().toString(36));

        const response = await fetch(url.toString());

        if(!response.ok) throw new Error(`HTTP ${ response.status }`);

        (window as any).__nitroClientMode = await response.json();
        setBootDebug('boot: client-mode loaded');
    }
    catch(error)
    {
        setBootDebug(`boot: client-mode fallback ${ error?.message || error }`);
    }
};

await loadClientMode();

const search = new URLSearchParams(window.location.search);
const clientMode = getClientMode();
const cacheBustUrl = (path: string): string =>
{
    const url = new URL(path.replace(/^\/+/, ''), `${ window.location.origin }/`);

    url.searchParams.set('v', Date.now().toString(36));

    return url.toString();
};

(window as any).NitroSecureApiUrl = clientMode.apiBaseUrl || window.location.origin;
(window as any).NitroClientMode = clientMode;
(window as any).NitroConfig = {
    'config.urls': [
        clientMode.secureAssetsEnabled ? secureUrl('config', 'renderer-config.json', true) : cacheBustUrl('configuration/renderer-config.json'),
        clientMode.secureAssetsEnabled ? secureUrl('config', 'ui-config.json', true) : cacheBustUrl('configuration/ui-config.json')
    ],
    'sso.ticket': search.get('sso') || null,
    'forward.type': search.get('room') ? 2 : -1,
    'forward.id': search.get('room') || 0,
    'friend.id': search.get('friend') || 0
};

setBootDebug('boot: NitroConfig assigned');

import('./index')
    .then(() => setBootDebug('boot: app bundle imported'))
    .catch(error =>
    {
        setBootDebug(`boot: import failed ${ error?.message || error }`);
        throw error;
    });
