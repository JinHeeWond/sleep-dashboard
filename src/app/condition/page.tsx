import { PageHeader } from "@/components/page-header";
import { ConditionForm } from "./condition-form";
import { fetchCondition, todayStr } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ConditionPage() {
  const today = todayStr();
  const existing = await fetchCondition(today);
  return (
    <>
      <PageHeader
        eyebrow={formatDate(today)}
        title="기상 컨디션 기록"
        description="오늘 아침 몸 상태를 알려주세요. 자세 데이터와 결합해 다음 기록의 정확도를 높입니다."
      />
      <ConditionForm date={today} initial={existing} />
    </>
  );
}
