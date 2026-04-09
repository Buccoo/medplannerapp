import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccentColorProvider } from "@/contexts/AccentColorContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Agenda from "./pages/app/Agenda";
import Medici from "./pages/app/Medici";
import Farmacie from "./pages/app/Farmacie";
import Prodotti from "./pages/app/Prodotti";
import Impostazioni from "./pages/app/Impostazioni";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccentColorProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="medici" element={<Medici />} />
              <Route path="farmacie" element={<Farmacie />} />
              <Route path="prodotti" element={<Prodotti />} />
              <Route path="impostazioni" element={<Impostazioni />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AccentColorProvider>
  </QueryClientProvider>
);

export default App;
