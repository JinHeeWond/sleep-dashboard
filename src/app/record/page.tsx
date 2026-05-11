import { requireUser } from "@/lib/auth";
import { RecordView } from "./record-view";

export default async function RecordPage() {
  const user = await requireUser();
  return <RecordView userId={user.id} />;
}
