import { requireUser } from "@/lib/auth";
import { RecordView } from "./record-view";

export default async function RecordPage() {
  await requireUser();
  return <RecordView />;
}
