import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import ThemeRegistry from "./ThemeRegistry";
import CopilotKitWrapper from "@/components/CopilotKitWrapper";
import { RecipeProvider } from "@/contexts/RecipeContext";
import AppReadyGate from "@/components/AppReadyGate";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Companion",
  description: "Cooking companion – extract recipes and get step-by-step guidance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable}`}
      >
        <ThemeRegistry>
          <CopilotKitWrapper>
            <RecipeProvider>
              <AppReadyGate>{children}</AppReadyGate>
            </RecipeProvider>
          </CopilotKitWrapper>
        </ThemeRegistry>
      </body>
    </html>
  );
}




