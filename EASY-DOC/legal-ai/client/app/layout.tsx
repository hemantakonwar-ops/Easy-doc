import type { Metadata } from "next";
import "./../styles/globals.css";
import { ThemeProvider } from "../lib/theme";

export const metadata: Metadata = {
  title: "Legal AI - Document Intelligence",
  description: "AI-powered legal document analysis and risk detection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
