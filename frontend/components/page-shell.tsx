import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { ThemeProvider } from "./theme-provider";

export function PageShell({
  children,
  fullFooter = false,
  showTopbar = false,
}: {
  children: React.ReactNode;
  fullFooter?: boolean;
  showTopbar?: boolean;
}) {
  return (
    <ThemeProvider>
      <Navbar showTopbar={showTopbar} />
      {children}
      <Footer full={fullFooter} />
    </ThemeProvider>
  );
}
