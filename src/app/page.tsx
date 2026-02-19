import { redirect } from "next/navigation";
import HomeLanding from "@/components/HomeLanding";
import { isRootPageEnabled } from "@/lib/featureFlags";

export default function HomePage() {
  if (!isRootPageEnabled()) {
    redirect("/browse");
  }

  return <HomeLanding />;
}
