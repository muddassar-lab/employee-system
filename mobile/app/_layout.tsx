import Providers from '@/providers'
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Providers>
      <Stack />
    </Providers>
  )
}
