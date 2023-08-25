import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useNetwork, Address, Chain } from 'wagmi'
import { Button, Heading, Text, ListItem, UnorderedList } from '@chakra-ui/react'
import { NextSeo } from 'next-seo'
import { LinkComponent } from 'components/layout/LinkComponent'
import { simpleNftABI, simpleNftAddress } from 'abis'

function MintNFT({ address, chain }: { address: Address; chain: Chain }) {
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

  return (
    <div>
      <Heading as="h3" fontSize="xl" my={4}>
        Try out
      </Heading>
      <Button
        width="full"
        disabled={waitForTransaction.isLoading || contractWrite.isLoading || !contractWrite.write}
        mt={4}
        onClick={handleSendTransation}>
        {waitForTransaction.isLoading ? 'Minting NFT...' : contractWrite.isLoading ? 'Check your wallet' : 'Mint NFT'}
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

export default function ListNft() {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()

  if (isConnected && address && chain) {
    return (
      <div>
        <NextSeo title="Mint NFT" />
        <Heading as="h2" fontSize="2xl" my={4}>
          Mint ERC721 NFT
        </Heading>
        <p>This example shows how to mint an ERC721 NFT.</p>

        {/* <UnorderedList>
          <ListItem>
            <LinkComponent href="https://docs.openzeppelin.com/contracts/3.x/erc721">ERC721</LinkComponent>
          </ListItem>
          <ListItem>
            <LinkComponent href="https://wagmi.sh/examples/contract-write">Wagmi Docs</LinkComponent>
          </ListItem>
        </UnorderedList> */}

        <MintNFT address={address} chain={chain} />
        {/* TODO: list NFT */}
      </div>
    )
  }

  return <div>Connect your wallet first to mint test NFT.</div>
}
