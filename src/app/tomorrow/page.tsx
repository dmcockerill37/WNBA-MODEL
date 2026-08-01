import { tomorrowET } from "@/lib/dates";
import ScanPage from "@/components/ScanPage";

export const revalidate = 300;

export default function TomorrowPage() {
  const date = tomorrowET();
  return <ScanPage gameDate={date} label="Tomorrow" />;
}
