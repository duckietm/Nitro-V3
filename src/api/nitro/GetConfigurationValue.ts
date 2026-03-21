import { GetConfiguration } from '@nitrots/configuration';

export function GetConfigurationValue<T = string>(key: string, value: T = null): T
{
    return GetConfiguration().getValue(key, value);
}
