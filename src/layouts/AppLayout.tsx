import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SubscriptionBanner from "@/components/SubscriptionBanner";

export default function AppLayout() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <SubscriptionBanner />
      <Outlet />
      <BottomNav />
    </div>
  );
}
