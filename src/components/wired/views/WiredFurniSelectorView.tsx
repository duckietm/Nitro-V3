import { FC } from 'react';
import { LocalizeText } from '../../../api';
import { Text } from '../../../common';
import { useWired } from '../../../hooks';

export const WiredFurniSelectorView: FC<{}> = (props) => {
    const { trigger = null, furniIds = [] } = useWired();

    return (
        <div className="flex flex-col gap-1 nitro-wired__furni-selector">
            <Text bold className="nitro-wired__furni-selector-title">
                {LocalizeText('wiredfurni.pickfurnis.caption', ['count', 'limit'], [furniIds.length.toString(), trigger.maximumItemSelectionCount.toString()])}
            </Text>
            <Text small className="nitro-wired__furni-selector-description">
                {LocalizeText('wiredfurni.pickfurnis.desc')}
            </Text>
        </div>
    );
};
