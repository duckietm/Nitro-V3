import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsView, NitroCardTabsItemView, NitroCardView } from '../../common';
import { InterfaceColorTabView } from './InterfaceColorTabView';
import { InterfaceProfileTabView } from './InterfaceProfileTabView';

const TABS = [ 'color', 'profile' ] as const;
type TabType = typeof TABS[number];

const TAB_LABELS: Record<TabType, string> = {
    color: 'Colore',
    profile: 'Sfondo profilo'
};

export const InterfaceSettingsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<TabType>('color');

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                    case 'profile':
                        setCurrentTab('profile');
                        setIsVisible(true);
                        return;
                }
            },
            eventUrlPrefix: 'interface-settings/'
        };

        AddLinkEventTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="interface-settings" className="min-w-[535px] max-w-[700px]">
            <NitroCardHeaderView headerText="Interfaccia" onCloseClick={ () => setIsVisible(false) } />
            <NitroCardTabsView>
                { TABS.map(tab => (
                    <NitroCardTabsItemView
                        key={ tab }
                        isActive={ currentTab === tab }
                        onClick={ () => setCurrentTab(tab) }
                    >
                        { TAB_LABELS[tab] }
                    </NitroCardTabsItemView>
                )) }
            </NitroCardTabsView>
            <NitroCardContentView>
                { currentTab === 'color' && <InterfaceColorTabView /> }
                { currentTab === 'profile' && <InterfaceProfileTabView /> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
