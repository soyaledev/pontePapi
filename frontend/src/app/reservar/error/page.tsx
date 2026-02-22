import { ErrorPageClient } from './ErrorPageClient';

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string; slug?: string }>;
}) {
  const { appointmentId } = await searchParams;
  return <ErrorPageClient appointmentId={appointmentId} />;
}
