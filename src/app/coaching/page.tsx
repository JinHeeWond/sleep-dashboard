import { fetchPostureDistributionRange } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { CoachingView } from "./coaching-view";

export default async function CoachingPage() {
  const user = await requireUser();
  const distribution = await fetchPostureDistributionRange(user.id, 14);
  return <CoachingView distribution={distribution} days={14} />;
}
