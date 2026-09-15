import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccentColorProvider } from "@/contexts/AccentColorContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Agenda from "./pages/app/Agenda";
import Medici from "./pages/app/Medici";
import Farmacie from "./pages/app/Farmacie";
import Prodotti from "./pages/app/Prodotti";
import Impostazioni from "./pages/app/Impostazioni";
import AdminDashboard from "./pages/app/AdminDashboard";
import Pianificazione from "./pages/app/Pianificazione";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import Privacy from "./pages/Privacy";
import Termini from "./pages/Termini";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccentColorProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/termini" element={<Termini />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="medici" element={<Medici />} />
                  <Route path="farmacie" element={<Farmacie />} />
                  <Route path="prodotti" element={<Prodotti />} />
                  <Route path="pianificazione" element={<Pianificazione />} />
                  <Route path="impostazioni" element={<Impostazioni />} />
                  <Route path="admin" element={<AdminDashboard />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AccentColorProvider>
  </QueryClientProvider>
);

export default App;
