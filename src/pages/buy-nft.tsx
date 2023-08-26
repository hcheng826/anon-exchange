import { Address, useAccount, useNetwork } from 'wagmi'
import { Heading } from '@chakra-ui/react'
import { NextSeo } from 'next-seo'
import { NftList, NftListItem } from 'components/layout/NftList'
import { useState } from 'react'
import { SemaphoreIdentitySecretInput } from 'components/layout/SemaphoreIdentitySecretInput'
import { RecipientAdressInput } from 'components/layout/RecipientAdressInput'
import { HeadingComponent } from 'components/layout/HeadingComponent'

export default function BuyNft() {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()

  // TODO: initialize NFT list
  const [nfts, setNfts] = useState<NftListItem[]>([])
  const [recipient, setRecipient] = useState<string>('')

  if (isConnected && address && chain) {
    return (
      <div>
        <NextSeo title="Buy NFT" />

        <HeadingComponent as="h2">Buy NFT</HeadingComponent>

        <SemaphoreIdentitySecretInput />

        <RecipientAdressInput {...{ recipient, setRecipient }} />

        <Heading as="h2" fontSize="2xl" my={4}>
          Buy NFT
        </Heading>

        <Heading as="h2" fontSize="1xl" my={4}>
          NFT Listings
        </Heading>

        <NftList nfts={nfts} />
      </div>
    )
  }

  return <div>Connect your wallet first to deposit ETH.</div>
}