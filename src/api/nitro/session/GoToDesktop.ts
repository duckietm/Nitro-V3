import { DesktopViewComposer } from '@nitrots/communication';
import { SendMessageComposer } from '../SendMessageComposer';

export function GoToDesktop(): void
{
    SendMessageComposer(new DesktopViewComposer());
}
