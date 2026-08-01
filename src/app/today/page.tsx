import { todayET } from "@/lib/dates";
import ScanPage from "@/components/ScanPage";

export const revalidate = 300; // revalidate every 5 min

export default function TodayPage() {
  const date = todayET();
  return <ScanPage gameDate={date} label="Today" />;
}
