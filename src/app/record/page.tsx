import { PageHeader } from "@/components/page-header";
import { RecordController } from "./record-controller";

export default function RecordPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live"
        title="수면 기록"
        description="잠자리에 들기 전 기록을 시작하세요. Azure Kinect가 자세를 자동으로 추적합니다."
      />
      <RecordController />
    </>
  );
}
