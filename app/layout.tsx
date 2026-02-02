import type { Metadata } from "next";
import "./globals.css";
import { RasaProvider } from "./context/RasaContext";

export const metadata: Metadata = {
  title: "my design rasa",
  description: "Decode and collect your visual vocabulary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701&f[]=sentient@200,201,300,301,400,401,500,501,700,701&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased flex min-h-screen flex-col"
      >
        <RasaProvider>
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-sm text-neutral-500">
            Built for everyone who loves design (including{" "}
            <a
              href="https://dharamlokhandwala.work"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              me
            </a>
            )
          </footer>
        </RasaProvider>
      </body>
    </html>
  );
}
