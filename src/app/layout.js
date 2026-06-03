import "./globals.css";

export const metadata = {
  title: "StudyHub",
  description: "Your all-in-one study resource hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem("theme") === "dark") {
                document.documentElement.classList.add("dark");
              }
            } catch(e) {}
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}