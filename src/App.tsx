import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ type: 'admin' | 'student'; id: string } | null>(() => {
    try {
      const saved = localStorage.getItem('school_user') ?? sessionStorage.getItem('school_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        const val = JSON.stringify(user);
        localStorage.setItem('school_user', val);
        sessionStorage.setItem('school_user', val);
      } else {
        localStorage.removeItem('school_user');
        sessionStorage.removeItem('school_user');
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleAdminLogin = (adminId: string) => {
    setUser({ type: 'admin', id: adminId });
  };

  const handleStudentLogin = (studentId: string) => {
    setUser({ type: 'student', id: studentId });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!user ? (
          <Login onAdminLogin={handleAdminLogin} onStudentLogin={handleStudentLogin} />
        ) : user.type === 'admin' ? (
          <AdminDashboard adminId={user.id} onLogout={handleLogout} />
        ) : (
          <StudentDashboard studentId={user.id} onLogout={handleLogout} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
