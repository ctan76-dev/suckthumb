import { redirect } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

export default function WallMomentRedirect({ params }: PageProps) {
  const anchor = `#post-${params.id}`;
  redirect(`/wall${anchor}`);
}
