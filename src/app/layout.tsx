import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Système de Réservation",
  description: "Plateforme intuitive pour réserver et gérer vos séjours, offrant un processus rapide, sécurisé et adapté à vos besoins.",
    icons: {
    icon: "/icon_logo.png", // Ruta desde /public
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      > 
           {children}
      </body>
    </html>
  );
}
