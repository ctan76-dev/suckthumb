import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WallMomentRedirect({ params }: PageProps) {
  const { id } = await params;
  const anchor = `#post-${id}`;
  redirect(`/wall${anchor}`);
}
