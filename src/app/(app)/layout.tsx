import { ShellWrapper } from "@/components/shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellWrapper>{children}</ShellWrapper>;
}
