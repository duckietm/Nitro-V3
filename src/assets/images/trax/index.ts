// Cartridge icons for the 72 Traxmachine sound sets, keyed by sound-set (cd) number.
const rawTraxCartridges = import.meta.glob('./*.gif', { eager: true, import: 'default' });

export const TRAX_CARTRIDGE_URLS: Record<string, string> = Object.entries(rawTraxCartridges).reduce(
    (accumulator, [path, url]) =>
    {
        const stem = (path.split('/').pop() || '').replace(/\.gif$/i, '');

        if (stem) accumulator[stem] = url;

        return accumulator;
    },
    {} as Record<string, string>
);

export const GetTraxCartridgeUrl = (cd: number): string => TRAX_CARTRIDGE_URLS[String(cd)] || '';
