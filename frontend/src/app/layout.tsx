import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SessionProvider } from "../components/auth/session-provider.tsx";

import "@/styles/tokens.css";
import "@/styles/app.css";
import "@/styles/institution-layout.css";
import "@/styles/auth.css";
import "@/styles/content.css";
import "@/styles/quizzes.css";
import "@/styles/landing.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-eb-garamond",
});

export const metadata: Metadata = {
  title: "AcademiX",
  description: "Plataforma académica AcademiX",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className={`${inter.variable} ${ebGaramond.variable}`}>
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
