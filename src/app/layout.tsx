import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components_/ToastContainer";
import "./globals.css";

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "f!le Go",
  description: "Share your files with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${patrickHand.className} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
