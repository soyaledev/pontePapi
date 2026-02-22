import { OwnerNavWrapper } from '@/components/OwnerNavWrapper';

export default function BarberiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerNavWrapper>{children}</OwnerNavWrapper>;
}
