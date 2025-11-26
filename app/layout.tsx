import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PWA Notifications Lab",
  description:
    "Progressive Web App ตัวอย่างที่รวมการแจ้งเตือนหลายรูปแบบ พร้อม service worker และ manifest",
  applicationName: "PWA Notifications Lab",
  themeColor: "#405cff",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PWA Notifications",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
