import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RuanginAja. | Smart Coworking Space & Workstation Booking",
  description: "Aplikasi Reservasi Coworking Space & Meja Kerja (Workstation) Fleksibel Secara Online. Uji Kompetensi Keahlian RPL 2026/2027.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
