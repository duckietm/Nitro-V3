import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { subscribePlugins } from './NitroPluginApi';

import './NitroPluginApi';

export const ExternalPluginLoader: FC<{}> = () =>
{
    const [, forceUpdate] = useState(0);
    const [ pluginUrls, setPluginUrls ] = useState<string[]>([]);

    useEffect(() =>
    {
        return subscribePlugins(() => forceUpdate(n => n + 1));
    }, []);

    useEffect(() =>
    {
        let urls: string[] = [];

        try
        {
            urls = GetConfigurationValue<string[]>('external.plugins', []) || [];
        }
        catch (e)
        {
            console.warn('[NitroPlugins] Could not read external.plugins config:', e);
            return;
        }

        if (!urls.length)
        {
            console.log('[NitroPlugins] No external plugins configured');
            return;
        }

        console.log('[NitroPlugins] Loading external plugins:', urls);
        setPluginUrls(urls);
    }, []);

    if (!pluginUrls.length) return null;

    return (
        <>
            { pluginUrls.map(url => (
                <script
                    key={ url }
                    async
                    src={ url }
                    onLoad={ () => console.log(`[NitroPlugins] Loaded: ${ url }`) }
                    onError={ () => console.warn(`[NitroPlugins] Failed to load: ${ url }`) } />
            )) }
        </>
    );
};
