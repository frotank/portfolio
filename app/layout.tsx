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
  title: "Gunesh Munjal — No. 09 — Business & Product Analyst",
  description:
    "Portfolio of Gunesh Munjal — business and product analyst in fintech and payments. 1,000+ customer interviews, a payments model that reached NPCI, and the tooling to back it up. Built like a race weekend: telemetry, classification, team radio.",
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
