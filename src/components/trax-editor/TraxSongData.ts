// Editor-side model of a trax song and its (de)serialization to the classic
// Habbo song-data string stored in soundtracks.track and played by the
// renderer's MusicPlayer: `1:sampleId,units;...:2:...:3:...:4:...:` where one
// unit is two seconds and sample id 0 is silence.

export interface ITraxPlacement {
    position: number;
    sampleId: number;
    length: number;
}

export const TRAX_CHANNEL_COUNT = 4;
export const TRAX_MAX_UNITS = 300;
export const TRAX_MIN_UNITS = 8;
export const TRAX_DEFAULT_UNITS = 32;

export type TraxChannels = ITraxPlacement[][];

export const CreateEmptyChannels = (): TraxChannels => Array.from({ length: TRAX_CHANNEL_COUNT }, () => []);

export const SerializeTraxSong = (channels: TraxChannels, songLength: number): string =>
{
    let result = '';

    for (let channel = 0; channel < TRAX_CHANNEL_COUNT; channel++)
    {
        const placements = [...(channels[channel] ?? [])].sort((a, b) => a.position - b.position);
        const items: string[] = [];
        let cursor = 0;

        for (const placement of placements)
        {
            if (placement.position > cursor) items.push(`0,${placement.position - cursor}`);

            items.push(`${placement.sampleId},${placement.length}`);
            cursor = placement.position + placement.length;
        }

        if (cursor < songLength) items.push(`0,${songLength - cursor}`);
        if (!items.length) items.push(`0,${songLength}`);

        result += `${channel + 1}:${items.join(';')}:`;
    }

    return result;
};

export const ParseTraxSong = (data: string): { channels: TraxChannels; songLength: number } =>
{
    const channels = CreateEmptyChannels();
    let songLength = 0;

    const parts = (data ?? '').split(':');

    for (let i = 0; i + 1 < parts.length; i += 2)
    {
        const channel = parseInt(parts[i]) - 1;
        if (isNaN(channel) || channel < 0 || channel >= TRAX_CHANNEL_COUNT) continue;

        let cursor = 0;

        for (const item of parts[i + 1].split(';'))
        {
            const comma = item.indexOf(',');
            if (comma <= 0) continue;

            const sampleId = parseInt(item.substring(0, comma));
            const length = parseInt(item.substring(comma + 1));
            if (isNaN(sampleId) || isNaN(length) || length < 1) continue;

            if (sampleId > 0) channels[channel].push({ position: cursor, sampleId, length });

            cursor += length;
        }

        songLength = Math.max(songLength, cursor);
    }

    songLength = Math.min(TRAX_MAX_UNITS, Math.max(TRAX_MIN_UNITS, songLength));

    return { channels, songLength };
};
