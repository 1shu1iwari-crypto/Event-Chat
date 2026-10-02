import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@cometchat/chat-uikit-react/styles";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  title: "EventOps · Your event, together",
  description:
    "Team chat, incident response, and your next move. A workspace for the people behind the event.",
  applicationName: "EventOps",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "EventOps" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f8fc",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
