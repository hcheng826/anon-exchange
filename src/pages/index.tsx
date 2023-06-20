import { Text } from '@chakra-ui/react'
import { Head } from 'components/layout/Head'
import { HeadingComponent } from 'components/layout/HeadingComponent'
import React from 'react'

export default function Home() {
  return (
    <>
      <Head />

      <main>
        <HeadingComponent as="h2">Anon Exchange</HeadingComponent>
        <Text>A showcase of how Semaphore protocol can be applied</Text>
      </main>
    </>
  )
}
