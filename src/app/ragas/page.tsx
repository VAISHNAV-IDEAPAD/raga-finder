import { redirect } from 'next/navigation';

export default function RagasPage({ searchParams }: { searchParams?: { sub?: string } }) {
  const sub = searchParams?.sub ? `&sub=${searchParams.sub}` : '';
  redirect(`/?tab=ragas${sub}`);
}

