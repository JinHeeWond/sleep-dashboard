import {
  fetchPostureLogs,
  fetchSession,
  fetchTimelapse,
  todayStr,
} from "@/lib/data";
import { summarizeLogs } from "@/lib/mock-data";
import { requireUser } from "@/lib/auth";
import { AnalysisView } from "./analysis-view";

interface SearchParams {
  searchParams?: Promise<{ date?: string }>;
}

export default async function AnalysisPage({ searchParams }: SearchParams) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const date = params.date ?? todayStr();

  const [logs, session, timelapse] = await Promise.all([
    fetchPostureLogs(date, user.id),
    fetchSession(date, user.id),
    fetchTimelapse(date, user.id),
  ]);
  const summary = summarizeLogs(logs);

  return (
    <AnalysisView
      date={date}
      logs={logs}
      session={session}
      distribution={summary.distribution}
      total={summary.total}
      timelapseUrl={timelapse?.url ?? null}
      timelapseSec={timelapse?.duration_sec ?? null}
    />
  );
}
