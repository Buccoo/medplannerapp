import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { usePointerEventsFix } from "@/hooks/usePointerEventsFix";

export default function AppLayout() {
  usePointerEventsFix();
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
    >
      <SubscriptionBanner />
      <Outlet />
      <BottomNav />
    </div>
  );
}
