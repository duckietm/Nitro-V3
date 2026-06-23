import { FC } from 'react';
import { GetConfigurationValue, LocalizeFormattedNumber, localizeWithFallback } from '../../../api';
import { Flex, Text } from '../../../common';

interface SeasonalViewProps {
    type: number;
    amount: number;
}

export const SeasonalView: FC<SeasonalViewProps> = (props) => {
    const { type = -1, amount = -1 } = props;
    const seasonalColor = GetConfigurationValue<string>('currency.seasonal.color', 'blue');
    const formattedAmount = LocalizeFormattedNumber(amount);
    const iconUrl = GetConfigurationValue<string>('currency.asset.icon.url', '').replace('%type%', type.toString());

    return (
        <Flex fullWidth justifyContent="between" className={`nitro-purse-seasonal-currency nitro-notification ${seasonalColor}`}>
            <Flex fullWidth className="seasonal-row">
                <Text truncate fullWidth variant="white" className="seasonal-text-padding seasonal-text">
                    {localizeWithFallback(`purse.seasonal.currency.${type}`, '')}
                </Text>
                <Text variant="white" className="seasonal-amount text-end" title={formattedAmount}>
                    {formattedAmount}
                </Text>
                <Flex className="nitro-seasonal-box seasonal-image-padding">
                    <img src={iconUrl} alt="" className="seasonal-image" />
                </Flex>
            </Flex>
        </Flex>
    );
};
