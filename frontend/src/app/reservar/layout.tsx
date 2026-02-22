import { OwnerNavWrapper } from '@/components/OwnerNavWrapper';

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerNavWrapper>{children}</OwnerNavWrapper>;
}
