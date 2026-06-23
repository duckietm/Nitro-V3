import { GetTargetedOfferComposer, TargetedOfferData, TargetedOfferEvent } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { useNitroQuery } from '../../../../api/nitro-query';
import { OfferBubbleView } from './OfferBubbleView';
import { OfferWindowView } from './OfferWindowView';

export const OfferView = () => {
    const { data: offer } = useNitroQuery<TargetedOfferEvent, TargetedOfferData>({
        key: ['nitro', 'catalog', 'targeted-offer'],
        request: () => new GetTargetedOfferComposer(),
        parser: TargetedOfferEvent,
        select: (evt) => evt.getParser()?.data ?? null,
        staleTime: Infinity
    });

    const [opened, setOpened] = useState<boolean>(false);

    if (!offer) return null;

    return <>{opened ? <OfferWindowView offer={offer} setOpen={setOpened} /> : <OfferBubbleView offer={offer} setOpen={setOpened} />}</>;
};
