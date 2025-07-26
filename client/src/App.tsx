import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import  AdminPanel  from "./components/portal/AdminPortal";
import UploadPage from "./components/portal/UploadPanel";
import { AuthProvider } from "./hooks/AuthContext";
import { AuthorizationPage } from "./components/portal/pages/AuthorizationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/auth" element={<AuthorizationPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/upload" element={<UploadPage />} />

          {/* CATCH-ALL ROUTE FOR 404 NOT FOUND */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
