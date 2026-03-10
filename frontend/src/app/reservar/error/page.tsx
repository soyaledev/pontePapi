import { ErrorPageClient } from './ErrorPageClient';

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string; slug?: string; [k: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const appointmentId = params.appointmentId;
  const slug = params.slug;
  const searchParamsObj = Object.keys(params).length ? (params as Record<string, string>) : undefined;
  return <ErrorPageClient appointmentId={appointmentId} slug={slug} searchParams={searchParamsObj} />;
}
