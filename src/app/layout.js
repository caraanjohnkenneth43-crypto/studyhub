import "./globals.css";
import { AuthProvider } from "./AuthProvider"

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
    <html lang="en" className="h-full antialiased density-comfortable" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = JSON.parse(localStorage.getItem("studyhub-settings") || "{}");
                if (s.dark) document.documentElement.classList.add("dark");
                if (s.fontSize === "small") document.documentElement.style.fontSize = "14px";
                else if (s.fontSize === "large") document.documentElement.style.fontSize = "18px";
                if (s.density) document.documentElement.classList.add("density-" + s.density);
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}