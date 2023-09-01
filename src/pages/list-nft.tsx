import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useNetwork,
  Address,
  Chain,
  useContractRead,
  useContractEvent,
} from 'wagmi'
import { Button, Heading, Text, Flex, Input, Table, Thead, Tr, Th, Tbody, Td, InputGroup, InputLeftAddon, list, useToast } from '@chakra-ui/react'
import { NextSeo } from 'next-seo'
import { LinkComponent } from 'components/layout/LinkComponent'
import { anonExchangeABI, anonExchangeAddress, simpleNftABI, simpleNftAddress } from 'abis'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { NftList } from 'components/layout/NftList'
import { SemaphoreIdentitySecretInput } from 'components/layout/SemaphoreIdentitySecretInput'
import { HeadingComponent } from 'components/layout/HeadingComponent'
import useAnonExchange from 'hooks/useAnonExchange'
import { NftListing } from 'context/AnonExchangeContext'
import { Contract, ethers } from 'ethers'
import { isAddress } from 'viem'
import { Identity } from '@semaphore-protocol/identity'

function MintNFT({ address, chain, setNfts }: { address: Address; chain: Chain; setNfts: Dispatch<SetStateAction<NftListing[]>> }) {
  const prepareContractWrite = usePrepareContractWrite({
    address: simpleNftAddress[chain.id as keyof typeof simpleNftAddress],
    abi: simpleNftABI,
    functionName: 'safeMint',
    args: [address],
  })

  const contractWrite = useContractWrite(prepareContractWrite.config)
  const waitForTransaction = useWaitForTransaction({ hash: contractWrite.data?.hash })

  const handleSendTransation = () => {
    contractWrite.write?.()
  }

  useEffect(() => {
    const simpleNft = new ethers.Contract(
      simpleNftAddress[chain?.id as keyof typeof simpleNftAddress],
      simpleNftABI,
      new ethers.providers.JsonRpcProvider(chain?.rpcUrls.default.http[0])
    )
    if (waitForTransaction.isSuccess) {
      simpleNft
        ._tokenIdCounter() // replace with your actual function name
        .then((tokenId: string) => {
          setNfts((prevNfts) => [
            ...prevNfts,
            {
              contractAddress: simpleNft.address,
              tokenId: parseInt(tokenId) - 1,
              status: 'NotListed',
            },
          ])
        })
        .catch((error: any) => {
          console.error('Error fetching tokenId:', error)
        })
    }
  }, [chain?.id, chain?.rpcUrls.default.http, setNfts, waitForTransaction.isSuccess])

  return (
    <div>
      {!contractWrite.write && <p>Please connect to Sepolia testnet</p>}
      <Button
        width="full"
        disabled={waitForTransaction.isLoading || contractWrite.isLoading || !contractWrite.write}
        mt={4}
        onClick={handleSendTransation}>
        {waitForTransaction.isLoading ? 'Minting NFT...' : contractWrite.isLoading ? 'Check your wallet' : 'Mint Test NFT'}
      </Button>
      {waitForTransaction.isSuccess && (
        <div>
          <Text mt={2} fontSize="lg">
            Successfully Minted NFT!
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            <LinkComponent href={`${chain?.blockExplorers?.default.url}/tx/${contractWrite.data?.hash}`}>Check on block explorer</LinkComponent>
          </Text>
        </div>
      )}
      {waitForTransaction.isError && (
        <div>
          <Text mt={2} color="red" fontSize="lg">
            Error minting NFT
          </Text>
          <Text color="red" fontSize="lg" fontWeight="bold">
            {waitForTransaction.error?.message}
          </Text>
        </div>
      )}
    </div>
  )
}

function ImportNft({
  contractAddressInput,
  setContractAddressInput,
  tokenIdInput,
  setTokenIdInput,
  handleImport,
}: {
  contractAddressInput: string
  setContractAddressInput: Dispatch<SetStateAction<string>>
  tokenIdInput: number | null
  setTokenIdInput: Dispatch<SetStateAction<number | null>>
  handleImport: () => void
}) {
  return (
    <div>
      <Heading as="h2" fontSize="1xl" my={4}>
        Import your own NFT
      </Heading>

      <Flex mb={4} align="center">
        <InputGroup size="md" mr={2}>
          <InputLeftAddon>NFT Address</InputLeftAddon>
          <Input placeholder="0x12345...6789" value={contractAddressInput} onChange={(e) => setContractAddressInput(e.target.value)} />
        </InputGroup>

        <InputGroup size="md" mr={2}>
          <InputLeftAddon>Token ID</InputLeftAddon>
          <Input placeholder="Enter Token ID" type="number" value={tokenIdInput ?? ''} onChange={(e) => setTokenIdInput(Number(e.target.value))} />
        </InputGroup>

        {/* TODO: validate the input format and user owns the NFT */}
        <Button onClick={handleImport}>Import</Button>
      </Flex>
    </div>
  )
}

interface ListNFTProps {
  nft: NftListing
  chain: Chain
  identity: Identity
}

const ListNFT: React.FC<ListNFTProps> = ({ nft, chain, identity }) => {
  const anonExchangeAddr = anonExchangeAddress[chain.id as keyof typeof anonExchangeAddress]
  const [approved, setApproved] = useState<boolean>(false)
  const [listed, setListed] = useState<boolean>(false)

  // check approval
  const { data: approvedAddress } = useContractRead({
    address: nft.contractAddress as Address,
    abi: simpleNftABI,
    functionName: 'getApproved',
    args: [BigInt(nft.tokenId)],
    watch: true,
  })

  useEffect(() => {
    setApproved(approvedAddress === anonExchangeAddr)
  }, [anonExchangeAddr, approvedAddress, nft.contractAddress, nft.tokenId])

  // listen to list and delist NFT event
  useContractEvent({
    address: anonExchangeAddr,
    abi: anonExchangeABI,
    eventName: 'NftListed',
    listener(log) {
      const { nftAddr, tokenId } = log[0]?.args
      if (nftAddr === nft.contractAddress && tokenId === BigInt(nft.tokenId)) {
        setListed(true)
      }
    },
  })

  useContractEvent({
    address: anonExchangeAddr,
    abi: anonExchangeABI,
    eventName: 'NftDelisted',
    listener(log) {
      const { nftAddr, tokenId } = log[0]?.args
      if (nftAddr === nft.contractAddress && tokenId === BigInt(nft.tokenId)) {
        setListed(false)
      }
    },
  })

  // prepare contract write
  const prepareApprove = usePrepareContractWrite({
    address: nft.contractAddress as Address,
    abi: simpleNftABI,
    functionName: 'approve',
    args: [anonExchangeAddr, BigInt(nft.tokenId)],
  })

  const approve = useContractWrite(prepareApprove.config)

  const prepareListNFT = usePrepareContractWrite({
    address: anonExchangeAddress[chain.id as keyof typeof anonExchangeAddress],
    abi: anonExchangeABI,
    functionName: 'listNFT',
    args: [nft.contractAddress as Address, BigInt(nft.tokenId), identity.commitment],
  })

  const listNft = useContractWrite(prepareListNFT.config)

  const handleApprove = () => {
    approve.write?.()
  }

  const handleListNft = () => {
    listNft.write?.()
  }

  if (listed) {
    return <Button onClick={handleApprove}>Delist</Button>
  }

  if (!approved) {
    return <Button onClick={handleApprove}>Approve</Button>
  } else {
    return <Button onClick={handleListNft}>List</Button>
  }
}

export default function ListNftPage() {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()

  // const { nftListings } = useAnonExchange(address)
  const nftListings: NftListing[] = []

  const [nfts, setNfts] = useState<NftListing[]>(
    nftListings.filter((listing) => {
      return listing.lister && listing.lister === address
    })
  )

  const [contractAddressInput, setContractAddressInput] = useState<string>('')
  const [tokenIdInput, setTokenIdInput] = useState<number | null>(null)
  const [semaphoreId, setSemaphoreId] = useState<Identity>()

  const toast = useToast({
    title: 'Error',
    status: 'error',
    duration: 5000,
    isClosable: true,
    position: 'top-right', // Change to your desired corner
  })

  const { data: ownerOfImportNft } = useContractRead({
    address: contractAddressInput as Address,
    abi: simpleNftABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenIdInput || 0)],
    watch: true,
  })

  const handleImport = () => {
    if (!contractAddressInput || tokenIdInput === null || !isAddress(contractAddressInput)) {
      toast({
        description: 'Invalid input',
      })
      setTokenIdInput(null)
      return
    }

    if (
      nfts
        .map((nft) => {
          return nft.contractAddress
        })
        .includes(contractAddressInput) &&
      nfts
        .map((nft) => {
          return nft.tokenId
        })
        .includes(tokenIdInput)
    ) {
      toast({
        description: 'Already imported',
      })
      setTokenIdInput(null)
      return
    }

    if (ownerOfImportNft === address) {
      setNfts((prevNfts) => [
        ...prevNfts,
        {
          contractAddress: contractAddressInput,
          tokenId: tokenIdInput,
          status: 'NotListed', // default action
        },
      ])
    } else {
      toast({
        description: 'Not owner of the NFT',
      })
    }

    setTokenIdInput(null)
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

        <SemaphoreIdentitySecretInput semaphoreId={semaphoreId} setSemaphoreId={setSemaphoreId} />

        <Heading as="h2" fontSize="2xl" my={4}>
          NFT List
        </Heading>

        <ImportNft
          {...{
            contractAddressInput,
            setContractAddressInput,
            tokenIdInput,
            setTokenIdInput,
            handleImport,
          }}
        />

        <NftList
          nfts={nfts}
          statusAction={{
            // TODO override the buttons
            NotListed: { renderButton: (nft, chain, identity) => <ListNFT nft={nft} chain={chain} identity={identity} /> },
            Sold: {},
            Delisted: { renderButton: (nft, chain, identity) => <ListNFT nft={nft} chain={chain} identity={identity} /> },
            Listed: {},
          }}
          chain={chain}
          identity={semaphoreId}
        />
      </div>
    )
  }

  return <div>Connect your wallet first to mint test NFT.</div>
}
