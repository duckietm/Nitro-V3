import { FC } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { LocalizeText } from '../../../api';
import { Button, Text } from '../../../common';

export const FURNI_SOURCES = [
    { value: 0, label: 'wiredfurni.params.sources.furni.0' },
    { value: 100, label: 'wiredfurni.params.sources.furni.100' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' },
    { value: 201, label: 'wiredfurni.params.sources.furni.201' }
];

export const USER_SOURCES = [
    { value: 0, label: 'wiredfurni.params.sources.users.0' },
    { value: 200, label: 'wiredfurni.params.sources.users.200' },
    { value: 201, label: 'wiredfurni.params.sources.users.201' }
];

interface WiredSourcesSelectorProps
{
    showFurni?: boolean;
    showUsers?: boolean;
    furniSource?: number;
    userSource?: number;
    onChangeFurni?: (source: number) => void;
    onChangeUsers?: (source: number) => void;
}

export const WiredSourcesSelector: FC<WiredSourcesSelectorProps> = props =>
{
    const { showFurni = false, showUsers = false, furniSource = 0, userSource = 0, onChangeFurni = null, onChangeUsers = null } = props;

    const furniIndex = Math.max(0, FURNI_SOURCES.findIndex(s => s.value === furniSource));
    const userIndex = Math.max(0, USER_SOURCES.findIndex(s => s.value === userSource));

    const prevFurni = () =>
    {
        const next = (furniIndex - 1 + FURNI_SOURCES.length) % FURNI_SOURCES.length;
        onChangeFurni && onChangeFurni(FURNI_SOURCES[next].value);
    };

    const nextFurni = () =>
    {
        const next = (furniIndex + 1) % FURNI_SOURCES.length;
        onChangeFurni && onChangeFurni(FURNI_SOURCES[next].value);
    };

    const prevUsers = () =>
    {
        const next = (userIndex - 1 + USER_SOURCES.length) % USER_SOURCES.length;
        onChangeUsers && onChangeUsers(USER_SOURCES[next].value);
    };

    const nextUsers = () =>
    {
        const next = (userIndex + 1) % USER_SOURCES.length;
        onChangeUsers && onChangeUsers(USER_SOURCES[next].value);
    };

    if(!showFurni && !showUsers) return null;

    return (
        <div className="flex flex-col gap-2">
            { showFurni &&
                <>
                    <Text bold>{ LocalizeText('wiredfurni.params.sources.furni.title') }</Text>
                    <div className="flex items-center gap-2">
                        <Button variant="primary" className="px-2 py-1" onClick={ prevFurni }><FaChevronLeft /></Button>
                        <div className="flex flex-1 items-center justify-center">
                            <Text small>{ LocalizeText(FURNI_SOURCES[furniIndex].label) }</Text>
                        </div>
                        <Button variant="primary" className="px-2 py-1" onClick={ nextFurni }><FaChevronRight /></Button>
                    </div>
                </> }

            { showFurni && showUsers && <hr className="m-0 bg-dark" /> }

            { showUsers &&
                <>
                    <Text bold>{ LocalizeText('wiredfurni.params.sources.users.title') }</Text>
                    <div className="flex items-center gap-2">
                        <Button variant="primary" className="px-2 py-1" onClick={ prevUsers }><FaChevronLeft /></Button>
                        <div className="flex flex-1 items-center justify-center">
                            <Text small>{ LocalizeText(USER_SOURCES[userIndex].label) }</Text>
                        </div>
                        <Button variant="primary" className="px-2 py-1" onClick={ nextUsers }><FaChevronRight /></Button>
                    </div>
                </> }
        </div>
    );
};

