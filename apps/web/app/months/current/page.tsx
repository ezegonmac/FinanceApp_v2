import { redirect } from "next/navigation";

export default function CurrentMonthRedirect() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  redirect(`/months/${currentYear}/${currentMonth}`);
}
