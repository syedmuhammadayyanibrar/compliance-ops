import "./globals.css";
import { Shell } from "../components/layout/Shell";

export const metadata = {
  title: "ComplianceOps - Enterprise AI Compliance & Governance Platform",
  description: "Evidence-driven autonomous AI compliance auditing with deterministic policy gates under the EU AI Act",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface text-tx-primary antialiased min-h-screen">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
