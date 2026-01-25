import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moviefy | Your Personal Cinema Universe",
  description: "Create lists, rate movies, and get AI-powered recommendations based on your taste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#121214",
          colorText: "#ffffff",
          colorInputBackground: "#1a1a1c",
          colorInputText: "#ffffff",
        },
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
