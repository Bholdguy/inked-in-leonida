import type { Metadata } from "next";
import { Pirata_One, Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";

// PRD 8.3: Syne for display, Space Grotesk for UI and body, Pirata One for tattoo-flash accents.
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const pirataOne = Pirata_One({ variable: "--font-pirata-one", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Inked in Leonida",
  description: "Night shift at a Leonida tattoo parlor. Built with Unlayer React Image Editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${spaceGrotesk.variable} ${pirataOne.variable} antialiased`}>{children}</body>
    </html>
  );
}
