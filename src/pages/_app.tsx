import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";
import { AvatarProvider } from "@/context/AvatarContext";
import { LikeProvider } from "@/context/LikeContext";
import ThemeInit from "@/components/ThemeInit";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeInit />
      <Head>
        <title>PixelNest</title>
        <meta name="description" content="PixelNest — 公开图片画廊与分享。" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AvatarProvider>
        <LikeProvider>
          <Component {...pageProps} />
        </LikeProvider>
      </AvatarProvider>
    </SessionProvider>
  );
}