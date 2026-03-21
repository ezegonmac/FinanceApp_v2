import { Suspense } from "react";
import MonthContent from "./month-content";

type Props = {
  params: Promise<{ year: string; month: string }>;
};

export default async function MonthPage({ params }: Props) {
  const { year: yearParam, month: monthParam } = await params;
  const year = Number(yearParam);
  const month = Number(monthParam);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <MonthContent year={year} month={month} />
    </Suspense>
  );
}
