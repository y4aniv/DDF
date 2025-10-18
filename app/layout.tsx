import type { Metadata } from "next";
import "@/styles/globals.css";

const metadata: Metadata = {
  title: "DDF: Dico Du Fada",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
};

export { metadata };
export default RootLayout;
