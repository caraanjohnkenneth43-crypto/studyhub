import "./globals.css";

export const metadata = {
  title: "StudyHub",
  description: "Your all-in-one study resource hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
