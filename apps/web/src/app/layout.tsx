import type { AppProps } from 'next/app';

// Root layout — see app/layout.tsx for App Router layout
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
