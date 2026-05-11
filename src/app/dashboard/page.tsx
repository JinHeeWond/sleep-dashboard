import {
  fetchHistory,
  fetchMorningCondition,
  fetchPostureLogs,
  fetchSession,
  todayStr,
} from "@/lib/data";
import { summarizeLogs } from "@/lib/mock-data";
import { requireUser, displayName } from "@/lib/auth";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayStr();
  const [logs, session, history, condition] = await Promise.all([
    fetchPostureLogs(today, user.id),
    fetchSession(today, user.id),
    fetchHistory(user.id, 7),
    fetchMorningCondition(today, user.id),
  ]);
  const summary = summarizeLogs(logs);
  return (
    <DashboardView
      logs={logs}
      session={session}
      history={history}
      distribution={summary.distribution}
      userName={displayName(user)}
      today={today}
      condition={condition}
    />
  );
}
