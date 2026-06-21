import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, ReportState } from '../../api';
import { Column, Grid, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useHelp } from '../../hooks';
import { DescribeReportView } from './views/DescribeReportView';
import { HelpIndexView } from './views/HelpIndexView';
import { NameChangeView } from './views/name-change/NameChangeView';
import { ReportSummaryView } from './views/ReportSummaryView';
import { SanctionSatusView } from './views/SanctionStatusView';
import { SelectReportedChatsView } from './views/SelectReportedChatsView';
import { SelectReportedUserView } from './views/SelectReportedUserView';
import { SelectTopicView } from './views/SelectTopicView';

export const HelpView: FC<{}> = (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const { activeReport = null, setActiveReport = null, report = null } = useHelp();

    const onClose = () => {
        setActiveReport(null);
        setIsVisible(false);
    };

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible((prevValue) => !prevValue);
                        return;
                    case 'tour':
                        // todo: launch tour
                        return;
                    case 'report':
                        if (parts.length >= 5 && parts[2] === 'room') {
                            const roomId = parseInt(parts[3]);
                            const unknown = unescape(parts.splice(4).join('/'));
                            //this.reportRoom(roomId, unknown, "");
                        }
                        return;
                }
            },
            eventUrlPrefix: 'help/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() => {
        if (!activeReport) return;

        setIsVisible(true);
    }, [activeReport]);

    const CurrentStepView = () => {
        if (activeReport) {
            switch (activeReport.currentStep) {
                case ReportState.SELECT_USER:
                    return <SelectReportedUserView />;
                case ReportState.SELECT_CHATS:
                    return <SelectReportedChatsView />;
                case ReportState.SELECT_TOPICS:
                    return <SelectTopicView />;
                case ReportState.INPUT_REPORT_MESSAGE:
                    return <DescribeReportView />;
                case ReportState.REPORT_SUMMARY:
                    return <ReportSummaryView />;
            }
        }

        return <HelpIndexView />;
    };

    return (
        <>
            {isVisible && (
                <NitroCardView
                    className={`nitro-help min-w-0 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]${activeReport ? '' : ' w-[min(420px,calc(100vw-16px))]'}`}
                    theme="primary-slim"
                >
                    <NitroCardHeaderView headerText={LocalizeText('help.button.cfh')} onCloseClick={onClose} />
                    <NitroCardContentView className="text-black">
                        {activeReport ? (
                            <Grid>
                                <Column center overflow="hidden" size={5}>
                                    <div className="index-image" />
                                </Column>
                                <Column justifyContent="between" overflow="hidden" size={7}>
                                    <CurrentStepView />
                                </Column>
                            </Grid>
                        ) : (
                            <CurrentStepView />
                        )}
                    </NitroCardContentView>
                </NitroCardView>
            )}
            <SanctionSatusView />
            <NameChangeView />
        </>
    );
};
