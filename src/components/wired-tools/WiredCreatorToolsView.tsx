import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { Button, DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';

type WiredToolsTab = 'monitor' | 'variables' | 'inspection' | 'chests' | 'settings';

interface MonitorStat
{
    label: string;
    value: string;
}

interface MonitorLog
{
    type: string;
    category: string;
    amount: string;
    latest: string;
}

const TABS: Array<{ key: WiredToolsTab; label: string; }> = [
    { key: 'monitor', label: 'Monitor' },
    { key: 'variables', label: 'Variables' },
    { key: 'inspection', label: 'Inspection' },
    { key: 'chests', label: 'Chests' },
    { key: 'settings', label: 'Settings' }
];

const MONITOR_STATS: MonitorStat[] = [
    { label: 'Wired usage', value: '0/10000' },
    { label: 'Is heavy', value: 'No' },
    { label: 'Floor furni', value: '0/4000' },
    { label: 'Wall furni', value: '0/4000' },
    { label: 'Permanent furni vars', value: '0/60' }
];

const MONITOR_LOGS: MonitorLog[] = [
    { type: 'EXECUTION_CAP', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'DELAYED_EVENTS_CAP', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'EXECUTOR_OVERLOAD', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'MARKED_AS_HEAVY', category: 'WARNING', amount: '0', latest: '/' },
    { type: 'KILLED', category: 'ERROR', amount: '0', latest: '/' },
    { type: 'RECURSION_TIMEOUT', category: 'ERROR', amount: '0', latest: '/' }
];

export const WiredCreatorToolsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<WiredToolsTab>('monitor');

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
                        setIsVisible(prevValue => !prevValue);
                        return;
                    case 'tab':
                        if(parts.length > 2)
                        {
                            const tab = parts[2] as WiredToolsTab;

                            if(TABS.some(entry => entry.key === tab)) setActiveTab(tab);
                        }
                        setIsVisible(true);
                        return;
                }
            },
            eventUrlPrefix: 'wired-tools/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const currentTabLabel = useMemo(() => TABS.find(tab => tab.key === activeTab)?.label ?? 'Monitor', [ activeTab ]);

    if(!isVisible) return null;

    return (
        <NitroCardView className="min-w-[520px] max-w-[520px]" theme="primary-slim" uniqueKey="wired-creator-tools" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
            <NitroCardHeaderView headerText="Wired Creator Tools (:wired)" onCloseClick={ () => setIsVisible(false) } />
            <NitroCardTabsView justifyContent="start">
                { TABS.map(tab => (
                    <NitroCardTabsItemView key={ tab.key } isActive={ (activeTab === tab.key) } onClick={ () => setActiveTab(tab.key) }>
                        <Text>{ tab.label }</Text>
                    </NitroCardTabsItemView>
                )) }
            </NitroCardTabsView>
            <NitroCardContentView className="text-black bg-[#e9e6d9]" gap={ 3 }>
                <div className="rounded border border-[#2c5f73] overflow-hidden">
                    <div className="bg-[#24576d] text-white px-3 py-2 text-center">
                        <Text bold>{ currentTabLabel }</Text>
                    </div>
                    { (activeTab === 'monitor') &&
                        <div className="p-3 flex flex-col gap-3">
                            <div className="text-[11px] text-[#666] italic">
                                This is the initial shell for the Wired Creator Tools. We can now build the real functionality tab by tab.
                            </div>
                            <div className="grid grid-cols-[190px_1fr] gap-3">
                                <div className="bg-white rounded border border-[#b9b3a5] p-2 flex flex-col gap-1">
                                    <Text bold>Statistics:</Text>
                                    { MONITOR_STATS.map(stat => (
                                        <div key={ stat.label } className="flex justify-between gap-2 text-[12px]">
                                            <span>{ stat.label }:</span>
                                            <span>{ stat.value }</span>
                                        </div>
                                    )) }
                                </div>
                                <div className="rounded border border-[#b9b3a5] bg-[linear-gradient(135deg,#2b5f73_0%,#1b4658_100%)] min-h-[140px] flex items-center justify-center text-center px-4">
                                    <div className="text-white/90 text-sm">
                                        <Text bold>Monitor Preview</Text>
                                        <div className="mt-2 text-[12px] opacity-80">
                                            Live statistics, executor health and diagnostics can be connected here next.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded border border-[#b9b3a5] p-2 flex flex-col gap-2">
                                <Text bold>Logs:</Text>
                                <div className="max-h-[180px] overflow-y-auto border border-[#d1ccbf] rounded">
                                    <table className="w-full text-[12px]">
                                        <thead className="bg-[#efede5] sticky top-0">
                                            <tr>
                                                <th className="text-left px-2 py-1">Type</th>
                                                <th className="text-left px-2 py-1">Category</th>
                                                <th className="text-left px-2 py-1">Amount</th>
                                                <th className="text-left px-2 py-1">Latest occurrence</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            { MONITOR_LOGS.map((log, index) => (
                                                <tr key={ log.type } className={ (index % 2 === 0) ? 'bg-white' : 'bg-[#f8f6f0]' }>
                                                    <td className="px-2 py-1 text-[#1b57b2]">{ log.type }</td>
                                                    <td className="px-2 py-1">{ log.category }</td>
                                                    <td className="px-2 py-1">{ log.amount }</td>
                                                    <td className="px-2 py-1">{ log.latest }</td>
                                                </tr>
                                            )) }
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <Button disabled variant="danger">Clear all</Button>
                                    <Button disabled variant="secondary">View full logs</Button>
                                </div>
                            </div>
                        </div> }
                    { (activeTab !== 'monitor') &&
                        <div className="p-4 min-h-[360px] flex items-center justify-center text-center text-[#555]">
                            <div className="max-w-[320px]">
                                <Text bold>{ currentTabLabel }</Text>
                                <div className="mt-2 text-[12px]">
                                    This tab is now ready to be wired into the new `:wired` tools flow.
                                </div>
                            </div>
                        </div> }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
