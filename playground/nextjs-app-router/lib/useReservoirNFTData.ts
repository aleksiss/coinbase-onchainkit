import type { ContractType } from '@/onchainkit/esm/nft/types';
import type { definitions } from '@reservoir0x/reservoir-sdk';
import { useQuery } from '@tanstack/react-query';
import { ENVIRONMENT_VARIABLES } from './constants';

type NonNullable<T> = T & {};
type Token = NonNullable<
  NonNullable<definitions['getTokensV7Response']['tokens']>[0]
>['token'];

function useToken(contractAddress: string, tokenId?: string) {
  return useQuery({
    queryKey: ['token', contractAddress, tokenId],
    queryFn: async () => {
      const qs = tokenId
        ? `tokens=${contractAddress}:${tokenId}`
        : `collection=${contractAddress}`;
      const response = await fetch(
        `https://api-base.reservoir.tools/tokens/v7?${qs}&includeLastSale=true`,
        {
          method: 'GET',
          headers: {
            accept: '*/*',
            'x-api-key': ENVIRONMENT_VARIABLES.RESERVOIR_API_KEY ?? '',
          },
        },
      );
      const data = await response.json();
      // if no tokenId, get the collection and default to the first token
      return data.tokens[0].token as Token;
    },
  });
}

export function useReservoirNFTData(contractAddress: string, tokenId = '0') {
  const { data: token } = useToken(contractAddress, tokenId);

  return {
    name: token?.name,
    description: token?.description,
    imageUrl: token?.image,
    animationUrl: token?.media,
    mimeType: (token?.metadata?.mediaMimeType ??
      token?.metadata?.imageMimeType ??
      '') as string,
    ownerAddress: token?.owner as `0x${string}`,
    lastSoldPrice: {
      amount: token?.lastSale?.price?.amount?.decimal,
      currency: token?.lastSale?.price?.currency?.symbol,
      amountUSD: token?.lastSale?.price?.amount?.usd,
    },
    contractType: token?.kind?.toUpperCase() as ContractType,
    mintDate: token?.mintedAt ? new Date(token?.mintedAt) : undefined,
  };
}
