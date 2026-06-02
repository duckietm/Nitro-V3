import { YouTubeRoomSettingsComposer, YouTubeRoomSettingsEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { getYoutubeRoomEnabled, IRoomData, LocalizeText, SendMessageComposer, setYoutubeRoomEnabled } from '../../../../api';
import { useMessageEvent, useSoundboard } from '../../../../hooks';

interface NavigatorRoomSettingsMiscTabViewProps
{
    roomData: IRoomData;
}

export const NavigatorRoomSettingsMiscTabView: FC<NavigatorRoomSettingsMiscTabViewProps> = props =>
{
    const { roomData = null } = props;
    const [ youtubeEnabled, setYoutubeEnabled ] = useState(getYoutubeRoomEnabled());
    const [ cooldown, setCooldown ] = useState(false);
    const { enabled: soundboardEnabled, setRoomEnabled: setSoundboardEnabled } = useSoundboard();

    useMessageEvent<YouTubeRoomSettingsEvent>(YouTubeRoomSettingsEvent, event =>
    {
        setYoutubeEnabled(event.getParser().youtubeEnabled);
    });

    const toggleYouTube = (enabled: boolean) =>
    {
        if (cooldown) return;
        setYoutubeEnabled(enabled);
        setYoutubeRoomEnabled(enabled);
        SendMessageComposer(new YouTubeRoomSettingsComposer(enabled));
        setCooldown(true);
        setTimeout(() => setCooldown(false), 300);
    };

    const toggleSoundboard = (enabled: boolean) =>
    {
        if (cooldown) return;
        setSoundboardEnabled(enabled);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 300);
    };

    return (
        <>
            <div className="mb-3">
                <div className="font-bold text-sm mb-2">{ LocalizeText('product.type.other') }</div>
            </div>
            <div className="flex flex-col gap-3">
                <div className={`p-3 rounded transition-colors ${cooldown ? 'bg-gray-200 opacity-60' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-sm">📺 YouTube TV</div>
                            <div className="text-xs text-gray-500">Allow YouTube video broadcasting in this room</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ youtubeEnabled }
                                disabled={ cooldown }
                                onChange={ e => toggleYouTube(e.target.checked) }
                                className="w-5 h-5"
                            />
                        </label>
                    </div>
                </div>
                <div className={`p-3 rounded transition-colors ${cooldown ? 'bg-gray-200 opacity-60' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-sm">🔊 { LocalizeText('soundboard.title') }</div>
                            <div className="text-xs text-gray-500">{ LocalizeText('soundboard.room.setting.desc') }</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ soundboardEnabled }
                                disabled={ cooldown }
                                onChange={ e => toggleSoundboard(e.target.checked) }
                                className="w-5 h-5"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </>
    );
};
