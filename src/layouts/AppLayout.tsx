import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SubscriptionBanner from "@/components/SubscriptionBanner";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <SubscriptionBanner />
      <Outlet />
      <BottomNav />
    </div>
  );
}
