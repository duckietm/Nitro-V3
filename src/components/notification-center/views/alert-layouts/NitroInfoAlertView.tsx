import { FC, useMemo } from 'react';
import { LocalizeText, NotificationAlertItem, NotificationAlertType, OpenUrl } from '../../../../api';
import { Button, Column, Flex, LayoutAvatarImageView, LayoutNotificationAlertView, LayoutNotificationAlertViewProps, Text } from '../../../../common';

const INFO_AVATAR_FIGURE = 'hr-831-61.hd-180-2.lg-270-100.sh-290-110.ha-3129-100.fa-1205-63.cc-3039-100';

interface NitroInfoAlertViewProps extends LayoutNotificationAlertViewProps {
    item: NotificationAlertItem;
}

const REPORT_ISSUES_URL = 'https://github.com/duckietm/Nitro-V3/issues';

type InfoSection = { title: string; lines: string[]; kind: 'hotel' | 'server' | 'credits' | 'generic' };

const detectKind = (title: string): InfoSection['kind'] => {
    const t = title.toLowerCase();
    if (t.includes('hotel')) return 'hotel';
    if (t.includes('server')) return 'server';
    if (t.includes('credit')) return 'credits';
    return 'generic';
};

const parseInfoSections = (text: string): { version: string; sections: InfoSection[] } => {
    const version = (text.match(/<b>([^<]+)<\/b>/) || ['', ''])[1];

    const stripped = text.replace(/^<b>[^<]+<\/b>\r?\n?/, '').replace(/Report issues at:[^]*$/, '');

    const sections: InfoSection[] = [];
    const blocks = stripped.split(/\r?\n+/);

    for (const block of blocks) {
        if (!block.trim()) continue;

        const headerMatch = block.match(/<b>([^<]+)<\/b>/);
        if (!headerMatch) continue;

        const title = headerMatch[1];
        const rest = block.substring(block.indexOf('</b>') + 4);
        const lines = rest
            .split(/\r/)
            .map((l) => l.trim().replace(/^-\s*/, ''))
            .filter(Boolean);

        sections.push({ title, lines, kind: detectKind(title) });
    }

    return { version, sections };
};

const sectionIcon: Record<InfoSection['kind'], string> = {
    hotel: '🏨',
    server: '🖥️',
    credits: '⭐',
    generic: 'ℹ️'
};

const splitLabel = (line: string): { label: string; value: string } => {
    const idx = line.indexOf(':');
    if (idx === -1) return { label: '', value: line };
    return { label: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() };
};

export const NitroInfoAlertView: FC<NitroInfoAlertViewProps> = (props) => {
    const { item = null, title: titleProp = null, onClose = null, ...rest } = props;

    const { version, sections } = useMemo(() => {
        const text = (item && item.messages && item.messages[0]) || '';
        return parseInfoSections(text);
    }, [item]);

    const rawTitle = titleProp || (item && item.title) || '';
    const displayTitle = rawTitle && rawTitle !== 'nitro.info.title' ? rawTitle : 'Hotel Info';

    return (
        <LayoutNotificationAlertView title={displayTitle} onClose={onClose} {...rest} type={NotificationAlertType.NITRO_INFO}>
            <div className="nitro-info-hero">
                <div className="nitro-info-hero-stars" />
                {version && (
                    <div className="nitro-info-version-badge">
                        <span className="nitro-info-version-spark">✦</span>
                        <span className="nitro-info-version-text">{version}</span>
                        <span className="nitro-info-version-spark">✦</span>
                    </div>
                )}
            </div>
            <Flex fullHeight gap={2} overflow="hidden" className="nitro-info-content">
                <div className="nitro-info-avatar-wrap shrink-0">
                    <LayoutAvatarImageView figure={INFO_AVATAR_FIGURE} direction={2} classNames={['nitro-info-avatar']} />
                    <div className="nitro-info-avatar-shadow" />
                </div>
                <Column fullWidth gap={2} overflow="auto" className="nitro-info-body">
                    {sections.map((section, index) => (
                        <div key={index} className={`nitro-info-section nitro-info-section-${section.kind}`}>
                            <div className="nitro-info-section-header">
                                <span className="nitro-info-section-icon">{sectionIcon[section.kind]}</span>
                                <span className="nitro-info-section-title">{section.title}</span>
                            </div>
                            <div className="nitro-info-section-body">
                                {section.kind === 'credits' ? (
                                    <ul className="nitro-info-credits-list">
                                        {section.lines.map((line, i) => (
                                            <li key={i}>
                                                <span className="nitro-info-credit-star">★</span>
                                                <span>{line}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <ul className="nitro-info-stats-list">
                                        {section.lines.map((line, i) => {
                                            const { label, value } = splitLabel(line);
                                            return (
                                                <li key={i}>
                                                    {label && <span className="nitro-info-stat-label">{label}</span>}
                                                    <span className="nitro-info-stat-value">{value}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="nitro-info-footer">
                        <Text center small italics>
                            Found a bug? Help us improve!
                        </Text>
                        <Flex gap={1} fullWidth className="nitro-info-actions">
                            <Button fullWidth variant="success" className="nitro-info-report-btn" onClick={() => OpenUrl(REPORT_ISSUES_URL)}>
                                <span>🐞 Report Issues</span>
                            </Button>
                            <Button fullWidth onClick={onClose}>
                                {LocalizeText('generic.close')}
                            </Button>
                        </Flex>
                    </div>
                </Column>
            </Flex>
        </LayoutNotificationAlertView>
    );
};
