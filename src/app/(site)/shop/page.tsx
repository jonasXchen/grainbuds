import { redirect } from "next/navigation";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const legacyParams = await searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(legacyParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(`/${query ? `?${query}` : ""}#shop`);
}
