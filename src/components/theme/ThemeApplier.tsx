import { FC } from 'react';
import { useThemes } from '../../hooks';

// Mounted once at app level: subscribing to the shared theme store triggers the
// load + apply effects, so the saved/default custom theme is applied on boot
// and kept in sync when the user changes it from Settings. Renders nothing.
export const ThemeApplier: FC<{}> = () =>
{
    useThemes();

    return null;
};
