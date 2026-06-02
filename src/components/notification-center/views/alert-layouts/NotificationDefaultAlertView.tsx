import { FC, useMemo, useState } from 'react';
import { DispatchUiEvent, LocalizeText, NotificationAlertItem, NotificationAlertType, OpenUrl, RoomWidgetUpdateChatInputContentEvent } from '../../../../api';
import { Button, Column, Flex, LayoutNotificationAlertView, LayoutNotificationAlertViewProps } from '../../../../common';

interface NotificationDefaultAlertViewProps extends LayoutNotificationAlertViewProps
{
    item: NotificationAlertItem;
}

const COMMAND_LINE_PATTERN = /^\s*:[\w.-]+(?:\s.*)?$/;

interface CommandTemplateEntry
{
    command: string;
    description: string;
}

export const NotificationDefaultAlertView: FC<NotificationDefaultAlertViewProps> = props =>
{
    const { item = null, title = ((props.item && props.item.title) || ''), onClose = null, classNames = [], ...rest } = props;
    const [ imageFailed, setImageFailed ] = useState<boolean>(false);

    const alertLines = useMemo(() => item.messages.flatMap(message => message.split(/\r\n|\r|\n/g)), [ item.messages ]);
    const hasCommandTemplate = useMemo(() =>
    {
        const commandLines = alertLines.filter(line => COMMAND_LINE_PATTERN.test(line));

        return commandLines.length >= 4 || alertLines.some(line => /^Your Commands\(\d+\):?/i.test(line.trim()));
    }, [ alertLines ]);
    const commandTemplateContent = useMemo(() =>
    {
        const intro: string[] = [];
        const commands: CommandTemplateEntry[] = [];

        for(const rawLine of alertLines)
        {
            const text = rawLine.trim();

            if(!text.length) continue;

            if(COMMAND_LINE_PATTERN.test(text))
            {
                commands.push({ command: text, description: '' });
                continue;
            }

            if(commands.length)
            {
                const lastCommand = commands[commands.length - 1];

                lastCommand.description = lastCommand.description ? `${ lastCommand.description } ${ text }` : text;
                continue;
            }

            intro.push(text);
        }

        return { intro, commands };
    }, [ alertLines ]);

    const visitUrl = () =>
    {
        OpenUrl(item.clickUrl);

        onClose();
    };

    const copyCommandToChatInput = (command: string) =>
    {
        const chatValue = command.endsWith(' ') ? command : `${ command } `;

        DispatchUiEvent(new RoomWidgetUpdateChatInputContentEvent(RoomWidgetUpdateChatInputContentEvent.TEXT, chatValue));
    };

    const hasFrank = (item.alertType === NotificationAlertType.DEFAULT);
    const alertClassNames = hasCommandTemplate ? [ ...classNames, 'nitro-alert-command-list' ] : classNames;

    return (
        <LayoutNotificationAlertView title={ title } onClose={ onClose } classNames={ alertClassNames } { ...rest } type={ hasFrank ? NotificationAlertType.DEFAULT : item.alertType }>
            <Flex fullHeight gap={ hasFrank || (item.imageUrl && !imageFailed) ? 2 : 0 } overflow="auto">
                { hasFrank && !item.imageUrl && <div className="notification-frank shrink-0" /> }
                { item.imageUrl && !imageFailed && <img alt={ item.title } className="align-self-baseline" src={ item.imageUrl } onError={ () =>
                {
                    setImageFailed(true);
                } } /> }
                <div className={ [ 'notification-text overflow-y-auto flex flex-col w-full', (item.clickUrl && !hasFrank) ? 'justify-center' : '' ].join(' ') }>
                    { hasCommandTemplate && <div className="notification-command-template">
                        { commandTemplateContent.intro.map((text, index) =>
                            <div key={ index } className={ index === 0 ? 'notification-command-heading' : 'notification-command-copy' }>{ text }</div>) }
                        { commandTemplateContent.commands.map((entry, index) =>
                            <button key={ `${ entry.command }-${ index }` } className="notification-command-row" type="button" onClick={ () => copyCommandToChatInput(entry.command) }>
                                <span className="notification-command-name">{ entry.command }</span>
                                { entry.description && <span className="notification-command-description">{ entry.description }</span> }
                            </button>) }
                    </div> }
                    { !hasCommandTemplate && (item.messages.length > 0) && item.messages.map((message, index) =>
                    {
                        const htmlText = message.replace(/\r\n|\r|\n/g, '<br />');

                        return <div key={ index } dangerouslySetInnerHTML={ { __html: htmlText } } />;
                    }) }
                    { item.clickUrl && (item.clickUrl.length > 0) && (item.imageUrl && !imageFailed) && <>
                        <hr className="my-2 w-full" />
                        <Button className="align-self-center px-3" onClick={ visitUrl }>{ LocalizeText(item.clickUrlText) }</Button>
                    </> }
                </div>
            </Flex>
            { (!item.imageUrl || (item.imageUrl && imageFailed)) && <>
                <Column center alignItems="center" gap={ 0 }>
                    <hr className="my-2 w-full" />
                    { !item.clickUrl &&
                        <Button onClick={ onClose }>{ LocalizeText('generic.close') }</Button> }
                    { item.clickUrl && (item.clickUrl.length > 0) && <Button onClick={ visitUrl }>{ LocalizeText(item.clickUrlText) }</Button> }
                </Column>
            </> }
        </LayoutNotificationAlertView>
    );

};
