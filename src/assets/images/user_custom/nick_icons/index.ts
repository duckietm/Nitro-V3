const rawNickIcons = import.meta.glob('./*.gif', { eager: true, import: 'default' });

export const NICK_ICON_URLS: Record<string, string> = Object.entries(rawNickIcons).reduce((accumulator, [ path, url ]) =>
{
    const filename = path.split('/').pop() || '';
    const stem = filename.replace(/\.gif$/i, '');

    if(stem) accumulator[stem] = url;
    if(filename) accumulator[filename] = url;

    return accumulator;
}, {} as Record<string, string>);

export const GetNickIconUrl = (iconKey: string) =>
{
    if(!iconKey) return '';

    return (NICK_ICON_URLS[iconKey] || NICK_ICON_URLS[iconKey.toLowerCase()] || '');
};
