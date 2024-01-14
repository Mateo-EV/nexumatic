import { ThemeProvider } from "@/components/providers/ThemeProdiver";
import { TRPCReactProvider } from "@/trpc/react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </ThemeProvider>
  );
}
