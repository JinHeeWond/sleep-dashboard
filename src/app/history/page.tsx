import { fetchHistory, fetchMorningConditions } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { HistoryView } from "./history-view";

export default async function HistoryPage() {
  const user = await requireUser();
  const [history, conditions] = await Promise.all([
    fetchHistory(user.id, 14),
    fetchMorningConditions(user.id, 14),
  ]);
  return <HistoryView history={history} conditions={conditions} />;
}
