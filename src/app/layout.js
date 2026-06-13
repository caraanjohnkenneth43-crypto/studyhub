import "./globals.css";
import "@/styles/design-tokens.css";
import { AuthProvider } from "./AuthProvider"
import { ChatNotificationProvider } from "./ChatNotificationProvider"
import { ToastProvider } from "@/components/ui/Toast"
import AppShell from "@/components/layout/AppShell"

export const metadata = {
  title: "StudyHub",
  description: "Your all-in-one study resource hub",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-512.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = JSON.parse(localStorage.getItem("studyhub-settings") || "{}");
                if (s.dark) document.documentElement.classList.add("dark");
                var fontSize = s.fontSize;
                if (typeof fontSize === "number") document.documentElement.style.fontSize = fontSize + "px";
                else if (fontSize === "small") document.documentElement.style.fontSize = "14px";
                else if (fontSize === "large") document.documentElement.style.fontSize = "18px";
                if (s.theme) document.documentElement.setAttribute("data-theme", s.theme);
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker.register("/sw.js");
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ChatNotificationProvider>
            <ToastProvider>
              <AppShell>
                {children}
              </AppShell>
            </ToastProvider>
          </ChatNotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
