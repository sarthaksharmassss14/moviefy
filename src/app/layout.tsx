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
        elements: {
          socialButtonsBlockButton: {
            backgroundColor: "#27272a",
            border: "1px solid #3f3f46",
            color: "white",
            '&:hover': {
              backgroundColor: "#3f3f46",
            }
          },
          socialButtonsBlockButtonText: {
            color: "#ffffff !important",
            fontWeight: "600",
          },
          dividerLine: {
            backgroundColor: "#27272a",
          },
          dividerText: {
            color: "#71717a",
          },
          formButtonPrimary: {
            backgroundColor: "#4f46e5",
            '&:hover': {
              backgroundColor: "#4338ca",
            }
          },
          footerActionLink: {
            color: "#818cf8",
            '&:hover': {
              color: "#6366f1",
            }
          },
          card: {
            backgroundColor: "#121214",
            border: "1px solid #27272a",
          },
        }
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
