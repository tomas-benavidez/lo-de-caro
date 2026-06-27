import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "La Casa Cocina - Gestión",
  description: "Control de costos, producción y ventas de pastas y empanadas congeladas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Header />
        <main className="flex-1 pb-20 w-full overflow-y-auto px-4 py-6">
          <div className="max-w-md mx-auto w-full">
            {children}
          </div>
        </main>
        <Navigation />
      </body>
    </html>
  );
}
