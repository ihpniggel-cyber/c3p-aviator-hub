import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Library from "@/pages/Library";
import Quizzes from "@/pages/Quizzes";
import Profile from "@/pages/Profile";
import LandingAnimation from "@/pages/LandingAnimation";
import OpsRoom from "@/pages/OpsRoom";
import OpsRoom3D from "@/pages/OpsRoom3D";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function FullscreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-lg bg-gradient-gold animate-pulse-gold" />
    </div>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;

  return <AppLayout />;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/atterrissage" element={<LandingAnimation />} />
              <Route path="/ops" element={<OpsRoom />} />
              <Route path="/ops3d" element={<OpsRoom3D />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
