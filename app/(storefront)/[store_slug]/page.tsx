import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    store_slug: string;
  }>;
}

export default async function LegacyStorefrontRedirectPage({ params }: Props) {
  const { store_slug } = await params;
  redirect(`/s/${store_slug}`);
}
