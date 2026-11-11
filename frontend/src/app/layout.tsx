import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "../components/auth/session-provider.tsx";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/500-italic.css";
import "@fontsource/eb-garamond/600.css";
import "@fontsource/eb-garamond/600-italic.css";
import "@fontsource/eb-garamond/700.css";
import "@fontsource/eb-garamond/700-italic.css";

import "@/styles/tokens.css";
import "@/styles/app.css";
import "@/styles/institution-layout.css";
import "@/styles/auth.css";
import "@/styles/academic-records.css";
import "@/styles/content.css";
import "@/styles/quizzes.css";
import "@/styles/assignments.css";
import "@/styles/attempts.css";
import "@/styles/landing.css";
import "@/styles/accounts.css";

export const metadata: Metadata = {
  title: "AcademiX",
  description: "Plataforma académica AcademiX",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
