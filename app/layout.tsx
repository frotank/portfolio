import type { Metadata } from "next";
import { Titillium_Web, Barlow, Chakra_Petch } from "next/font/google";
import "./globals.css";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-titillium",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gunesh Munjal — No. 27 — Product Engineer",
  description:
    "Portfolio of Gunesh Munjal — product engineer building fintech and AI products. Built like a race weekend: telemetry, classification, team radio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${titillium.variable} ${barlow.variable} ${chakra.variable}`}
    >
      <head>
        <link rel="preload" as="image" href="/assets/w15-quarter.webp" />
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
