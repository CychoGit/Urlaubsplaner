import { motion, AnimatePresence, useAnimation, stagger } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Organization } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import AnimatedNavbar from "@/components/animated-navbar";
import StatsCards from "@/components/stats-cards";
import Calendar from "@/components/calendar";
import PendingRequests from "@/components/pending-requests";
import TeamStatus from "@/components/team-status";
import AnimatedVacationForm from "@/components/animated-vacation-form";
import VacationBalanceCard from "@/components/vacation-balance-card";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const heroVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15
    }
  }
};

const headerVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20
    }
  }
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { scale: 0.95 }
};

export default function AnimatedDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const controls = useAnimation();

  // Load organization data
  const orgId = user?.organizationId;
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', orgId],
    enabled: !!orgId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      controls.start("visible");
    }
  }, [isAuthenticated, controls]);

  const handleTeamCsvExport = async () => {
    try {
      const response = await fetch('/api/export', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'team-urlaube.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export erfolgreich",
        description: "Alle Urlaubsdaten wurden als CSV-Datei heruntergeladen.",
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Fehler beim Exportieren der Daten.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center theme-bg-pattern"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="skeleton w-8 h-8 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary glow-effect"></div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-full theme-bg-pattern"
      initial="hidden"
      animate={controls}
      variants={containerVariants}
    >
      <AnimatedNavbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div className="px-4 py-6 sm:px-0" variants={itemVariants}>
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            variants={headerVariants}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-foreground gradient-text" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <motion.p 
                className="mt-1 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Übersicht über alle Urlaubsanträge und Termine
              </motion.p>
            </motion.div>
            <motion.div 
              className="mt-4 sm:mt-0 flex space-x-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, staggerChildren: 0.1 }}
            >
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button 
                  onClick={() => setShowRequestForm(true)}
                  data-testid="button-new-request"
                  className="button-primary"
                >
                  <motion.div
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                  </motion.div>
                  Urlaub beantragen
                </Button>
              </motion.div>
              
              {user?.role === "admin" && (
                <AnimatePresence>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      variant="outline"
                      onClick={handleTeamCsvExport}
                      data-testid="button-export-team-csv"
                      className="button-secondary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Team CSV Export
                    </Button>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats Strip - Compact Horizontal */}
        <motion.div className="px-4 sm:px-0 mb-6" variants={itemVariants}>
          <StatsCards />
        </motion.div>

        {/* Hero Calendar Section - Full Width */}
        <motion.div 
          className="px-4 sm:px-0 mb-8"
          variants={heroVariants}
        >
          <motion.div 
            className="relative rounded-2xl overflow-hidden shadow-2xl card-hover"
            style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)",
              backdropFilter: "blur(10px)",
              minHeight: "clamp(480px, 65vh, 720px)"
            }}
            whileHover={{ 
              scale: 1.005,
              boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10 pointer-events-none" />
            
            {/* Calendar Content */}
            <div className="relative z-10">
              <Calendar />
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Content Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {/* Pending Requests (Admin/Tenant Admin only) */}
          {(user?.role === "admin" || user?.role === "tenant_admin") && (
            <motion.div variants={itemVariants}>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <PendingRequests />
              </motion.div>
            </motion.div>
          )}

          {/* Team Status */}
          <motion.div 
            className={user?.role === "admin" || user?.role === "tenant_admin" ? "" : "lg:col-span-2"}
            variants={itemVariants}
          >
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <TeamStatus />
            </motion.div>
          </motion.div>

          {/* Balance Card - moved to end to avoid layout gaps when hidden */}
          {organization?.vacationTrackingEnabled === true && user?.vacationTrackingEnabled === true && (
            <motion.div variants={itemVariants}>
              <VacationBalanceCard />
            </motion.div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showRequestForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnimatedVacationForm
              open={showRequestForm}
              onClose={() => setShowRequestForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
