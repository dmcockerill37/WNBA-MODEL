import { yesterdayET } from "@/lib/dates";
import ScanPage from "@/components/ScanPage";

export const revalidate = 300;

export default function YesterdayPage() {
  const date = yesterdayET();
  return <ScanPage gameDate={date} label="Yesterday" />;
}
