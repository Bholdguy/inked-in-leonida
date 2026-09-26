import type { Metadata, Viewport } from "next";
import { Pirata_One, Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";

// PRD 8.3: Syne for display, Space Grotesk for UI and body, Pirata One for tattoo-flash accents.
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const pirataOne = Pirata_One({ variable: "--font-pirata-one", subsets: ["latin"], weight: "400" });

const DESCRIPTION =
  "Night shift at a Leonida tattoo parlor. Design every piece in a real image editor, place it anywhere on the skin, cover up your own work. Built with Unlayer React Image Editor.";

export const metadata: Metadata = {
  metadataBase: new URL("https://inked-in-leonida.vercel.app"),
  title: "Inked in Leonida",
  description: DESCRIPTION,
  applicationName: "Inked in Leonida",
  keywords: ["tattoo game", "Unlayer", "React Image Editor", "BuiltWithImageEditor", "Leonida"],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Inked in Leonida",
    title: "Inked in Leonida · Their parlor is a menu. This one isn't.",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Inked in Leonida · Their parlor is a menu. This one isn't.",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = { themeColor: "#0b0714", colorScheme: "dark" };

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
