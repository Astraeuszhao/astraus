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
        <title>Astraus</title>
        <meta name="description" content="Astraus — 登录后浏览与分享图片。" />
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