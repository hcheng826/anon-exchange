import { Text } from '@chakra-ui/react'
import { CardList } from 'components/layout/CardList'
import { Head } from 'components/layout/Head'
import { HeadingComponent } from 'components/layout/HeadingComponent'
import React from 'react'
import EtherIcon from 'assets/icons/ethereum.png'
import NFTIcon from 'assets/icons/nft.png'
import CartIcon from 'assets/icons/cart.png'
import WithdrawIcon from 'assets/icons/withdraw.png'

export const OperationItems = [
  {
    title: 'List NFT',
    description: 'NFT sellers can import their own NFT or mint test NFT to list it on the exchange',
    image: NFTIcon.src,
    url: '/list-nft',
  },
  {
    title: 'Deposit ETH',
    description: 'NFT buyers deposit ETH to be eligible for purchasing NFTs',
    image: EtherIcon.src,
    url: '/deposit-eth',
  },
  {
    title: 'Buy NFT',
    description: 'With the secret associated with a valid ETH deposit, buyer can buy NFT and receive it at a desired address',
    image: CartIcon.src,
    url: '/buy-nft',
  },
  {
    title: 'NFT Seller Claim ETH',
    description:
      'With the secret associated with a valid NFT listing and after the NFT is sold. Seller can claim the ETH and receive it at a desired address',
    image: WithdrawIcon.src,
    url: '/claim-eth',
  },
]

export default function Home() {
  return (
    <>
      <Head />

      <main>
        <HeadingComponent as="h2">Anon Exchange</HeadingComponent>
        <Text>An anonomyous NFT exchange based on Semaphore protocol</Text>
        <br />
        <CardList title="Operations" items={OperationItems} />
      </main>
    </>
  )
}
