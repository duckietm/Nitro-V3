import {
    AddLinkEventTracker,
    ILinkEventTracker,
    RemoveLinkEventTracker,
} from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { GetConfigurationValue, LocalizeText, OpenUrl } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { DiscordPreferences, useDiscordSettings } from '../../hooks';

const localizeWithFallback = (key: string, fallback: string) => {
    const text = LocalizeText(key);
    return text && text !== key ? text : fallback;
};

interface CheckboxRowProps {
    label: string;
    description?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

const CheckboxRow: FC<CheckboxRowProps> = ({ label, description, checked, disabled = false, onChange }) => (
    <label
        className={
            'flex items-start gap-3 rounded-md border border-black/10 bg-white px-3 py-2 transition-colors ' +
            (disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#5865F2]')
        }
    >
        <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[#5865F2]"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
        />
        <div className="flex flex-col leading-tight">
            <Text bold>{label}</Text>
            {description && (
                <Text small className="text-black/60">
                    {description}
                </Text>
            )}
        </div>
    </label>
);

interface ServerLinkProps {
    label: string;
    configKey: string;
}

const ServerLink: FC<ServerLinkProps> = ({ label, configKey }) => {
    const link = GetConfigurationValue<string>(configKey, '');
    if (!link) return null;

    return (
        <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-md bg-[#5865F2] px-3 py-2 text-white shadow-[inset_0_2px_#ffffff26,inset_0_-2px_#0000001a] transition-colors hover:bg-[#4752c4] cursor-pointer"
            onClick={() => OpenUrl(link)}
        >
            <FaDiscord />
            <Text bold className="text-white">
                {label}
            </Text>
        </button>
    );
};

export const DiscordSettingsView: FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { preferences, updatePreferences } = useDiscordSettings();

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
                        setIsVisible((prev) => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'discord-settings/',
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if (!isVisible) return null;

    const setPref = (key: keyof DiscordPreferences) => (checked: boolean) =>
        updatePreferences({ [key]: checked });

    // Cascade enable rules mirror the Flash DiscordSettingsView.updateUI():
    // the sub-options only make sense while the master toggle (and, for the
    // last two, the "share activity" toggle) are on.
    const activityDisabled = !preferences.showHabbo;
    const subOptionDisabled = !preferences.showHabbo || !preferences.shareActivity;

    return (
        <NitroCardView className="discord-settings-window w-[360px]" theme="primary-slim" uniqueKey="discord-settings">
            <NitroCardHeaderView
                headerText={localizeWithFallback('discord.settings.title', 'Impostazioni Discord')}
                onCloseClick={() => setIsVisible(false)}
            />

            <div className="relative flex items-center gap-3 px-3 py-3 bg-[linear-gradient(180deg,#5865F2_0%,#4752c4_100%)] text-white">
                <div className="flex items-center justify-center w-[44px] h-[44px] shrink-0 rounded-full bg-white/20 border-2 border-white/40">
                    <FaDiscord size={24} />
                </div>
                <div className="flex flex-col leading-tight">
                    <Text bold className="text-white text-[15px]">
                        {localizeWithFallback('discord.settings.header', 'Discord Rich Presence')}
                    </Text>
                    <Text small className="text-white/80">
                        {localizeWithFallback('discord.settings.subtitle', 'Mostra la tua attività su Discord')}
                    </Text>
                </div>
            </div>

            <NitroCardContentView className="flex flex-col gap-2 text-black">
                <CheckboxRow
                    label={localizeWithFallback('discord.settings.show_habbo', 'Mostra Habbo su Discord')}
                    description={localizeWithFallback(
                        'discord.settings.show_habbo.desc',
                        'Visualizza che stai giocando ad Habbo sul tuo profilo Discord',
                    )}
                    checked={preferences.showHabbo}
                    onChange={setPref('showHabbo')}
                />
                <CheckboxRow
                    label={localizeWithFallback('discord.settings.share_activity', 'Condividi attività')}
                    description={localizeWithFallback(
                        'discord.settings.share_activity.desc',
                        'Mostra in quale stanza ti trovi e cosa stai facendo',
                    )}
                    checked={preferences.shareActivity}
                    disabled={activityDisabled}
                    onChange={setPref('shareActivity')}
                />
                <CheckboxRow
                    label={localizeWithFallback('discord.settings.hide_hidden', 'Nascondi stanze nascoste')}
                    description={localizeWithFallback(
                        'discord.settings.hide_hidden.desc',
                        'Non rivelare i dettagli quando sei in una stanza nascosta',
                    )}
                    checked={preferences.hideInHiddenRooms}
                    disabled={subOptionDisabled}
                    onChange={setPref('hideInHiddenRooms')}
                />
                <CheckboxRow
                    label={localizeWithFallback('discord.settings.allow_joining', 'Consenti di unirsi')}
                    description={localizeWithFallback(
                        'discord.settings.allow_joining.desc',
                        'Aggiungi un pulsante "Visita stanza" alla tua presence',
                    )}
                    checked={preferences.allowJoining}
                    disabled={subOptionDisabled}
                    onChange={setPref('allowJoining')}
                />

                <Text small className="text-black/60 uppercase tracking-wider px-1 pt-2">
                    {localizeWithFallback('discord.settings.servers', 'Server Discord')}
                </Text>
                <div className="flex flex-col gap-2">
                    <ServerLink
                        label={localizeWithFallback('discord.settings.server.collectibles', 'Collectibles')}
                        configKey="collectibles.discord.link"
                    />
                    <ServerLink
                        label={localizeWithFallback('discord.settings.server.wired', 'Wired')}
                        configKey="wired.discord.link"
                    />
                    <ServerLink
                        label={localizeWithFallback('discord.settings.server.origins', 'Origins')}
                        configKey="origins.discord.link"
                    />
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
