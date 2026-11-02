import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { QueryProvider } from "@/components/QueryProvider";
import { RadialBackground } from "@/components/ui/radial-background";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "SlatePic | Client-Side Image Metadata Scrubber",
  description:
    "Inspect and remove C2PA Content Credentials, EXIF, IPTC, XMP, and AI generator tags using browser-native HTML5 Canvas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
  ],
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('slatepic-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Synchronous theme initialization avoids light/dark flash on hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative flex min-h-full flex-col overflow-x-clip bg-transparent font-sans text-foreground">
        <RadialBackground />
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
