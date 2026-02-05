import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tables from "./pages/Tables";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import Credits from "./pages/Credits";
import Consumptions from "./pages/Consumptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/tables"
              element={
                <AppLayout>
                  <Tables />
                </AppLayout>
              }
            />
            <Route
              path="/customers"
              element={
                <AppLayout>
                  <Customers />
                </AppLayout>
              }
            />
            <Route
              path="/payments"
              element={
                <AppLayout>
                  <Payments />
                </AppLayout>
              }
            />
            <Route
              path="/credits"
              element={
                <AppLayout>
                  <Credits />
                </AppLayout>
              }
            />
            <Route
              path="/consumptions"
              element={
                <AppLayout>
                  <Consumptions />
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
