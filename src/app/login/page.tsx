import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/cabinet");
  const sp = await searchParams;
  return <LoginClient error={sp.error} registered={sp.registered === "1"} />;
}
