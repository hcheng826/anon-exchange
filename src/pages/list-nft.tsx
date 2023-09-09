import { useAccount, useNetwork } from 'wagmi'
import { Button, Heading, list } from '@chakra-ui/react'
import { NextSeo } from 'next-seo'
import { useCallback, useEffect, useState } from 'react'
import { NftList } from 'components/NftList'
import { SemaphoreIdentityGenerate } from 'components/SemaphoreIdentityGenerate'
import { HeadingComponent } from 'components/layout/HeadingComponent'
import { NftListing, NftStatus } from 'context/AnonExchangeContext'
import { Identity } from '@semaphore-protocol/identity'
import { MintNFT } from 'components/MintNftButton'
import { ImportNft } from 'components/ImportNftButton'
import { ListNFT } from 'components/ListNftButton'
import { DelistNFT } from 'components/DelistNftButton'
import { v4 as uuidv4 } from 'uuid'
import { ApproveAllNFT } from 'components/ApproveAllNftButton'
import useAnonExchange from 'hooks/useAnonExchange'
import { ListNftSold } from 'components/ListNftSoldButton'

export default function ListNftPage() {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()

  const [contractAddressInput, setContractAddressInput] = useState<string>('')
  const [tokenIdInput, setTokenIdInput] = useState<number | null>(null)
  const [semaphoreId, setSemaphoreId] = useState<Identity>()
  const [secret, setSecret] = useState(uuidv4())
  const { refreshNftListing } = useAnonExchange()

  const [nfts, setNfts] = useState<NftListing[]>([])

  useEffect(() => {
    const fetchAndSetListings = async () => {
      const nftListings = await refreshNftListing()

      const updatedNfts = nftListings
        .filter((nft) => nft.lister === address)
        .map((nft) => {
          return nft
        })

      setNfts((prevNfts) => {
        const newNfts = [...prevNfts]

        updatedNfts.forEach((updatedNft) => {
          const idx = newNfts.findIndex((nft) => nft.contractAddress === updatedNft.contractAddress && nft.tokenId === updatedNft.tokenId)

          if (idx !== -1) {
            newNfts[idx] = updatedNft as NftListing
          } else {
            newNfts.push(updatedNft as NftListing)
          }
        })

        return newNfts
      })
    }

    fetchAndSetListings() // Call once immediately when component mounts

    const intervalId = setInterval(fetchAndSetListings, 5000)

    return () => clearInterval(intervalId) // Cleanup interval when component unmounts
  }, [address, refreshNftListing])
  function refreshSecret() {
    setSecret(uuidv4())
  }

  function updateNftStatus(nftToUpdate: NftListing, newStatus: NftStatus) {
    setNfts((currentNfts) =>
      currentNfts.map((nft) => {
        if (nftToUpdate.tokenId === nft.tokenId && nftToUpdate.contractAddress === nft.contractAddress) {
          return { ...nft, status: newStatus }
        }
        return nft
      })
    )
  }

  if (isConnected && address && chain) {
    return (
      <div>
        <NextSeo title="Mint NFT" />

        <HeadingComponent as="h2">List NFT</HeadingComponent>

        <Heading as="h2" fontSize="2xl" my={4}>
          Mint Test NFT
        </Heading>
        <MintNFT address={address} chain={chain} setNfts={setNfts} />
        <ApproveAllNFT chain={chain} />

        <SemaphoreIdentityGenerate semaphoreId={semaphoreId} setSemaphoreId={setSemaphoreId} secret={secret} refreshSecret={refreshSecret} />

        <Heading as="h2" fontSize="2xl" my={4}>
          NFT List
        </Heading>

        <ImportNft
          {...{
            contractAddressInput,
            setContractAddressInput,
            tokenIdInput,
            setTokenIdInput,
            nfts,
            setNfts,
            address,
          }}
        />

        <NftList
          nfts={nfts}
          statusAction={{
            NotListed: {
              renderButton: semaphoreId
                ? (nft, chain) => (
                    <ListNFT
                      nft={nft}
                      chain={chain}
                      identity={semaphoreId}
                      updateNftStatus={updateNftStatus}
                      setSemaphoreId={setSemaphoreId}
                      refreshSecret={refreshSecret}
                    />
                  )
                : () => <Button disabled={true}>Please generate Semaphore Id first</Button>,
            },
            Sold: { renderButton: (nft) => <ListNftSold nft={nft} updateNftStatus={updateNftStatus} /> },
            Delisted: {
              renderButton: semaphoreId
                ? (nft, chain) => (
                    <ListNFT
                      nft={nft}
                      chain={chain}
                      identity={semaphoreId}
                      updateNftStatus={updateNftStatus}
                      setSemaphoreId={setSemaphoreId}
                      refreshSecret={refreshSecret}
                    />
                  )
                : () => <Button disabled={true}>Please generate Semaphore Id first</Button>,
            },
            Listed: { renderButton: (nft, chain) => <DelistNFT nft={nft} chain={chain} updateNftStatus={updateNftStatus} /> },
          }}
          chain={chain}
          identity={semaphoreId}
          updateNftStatus={updateNftStatus}
        />
      </div>
    )
  }

  return <div>Connect your wallet first to mint test NFT.</div>
}
