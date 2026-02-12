import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToaster } from "@/components/shared/app-toaster";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SACDIA Admin Panel",
  description: "Panel administrativo para SACDIA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
