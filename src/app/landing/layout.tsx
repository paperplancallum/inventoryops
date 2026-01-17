import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InventoryOps - Track Every Unit from Factory to Amazon",
  description: "The complete operations platform for Amazon FBA sellers. Manage purchase orders, track inventory through your supply chain, and never lose visibility of your products.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout bypasses the ShellWrapper by returning children directly
  // The parent layout's ShellWrapper will still wrap this, so we need to style around it
  return <>{children}</>;
}
