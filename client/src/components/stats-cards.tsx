import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Users, AlertTriangle, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface Stats {
  pendingRequests: number;
  approvedRequests: number;
  teamMembers: number;
  conflicts: number;
  pendingUsers?: number;
}

export default function StatsCards() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'tenant_admin';

  const cards = [
    ...(isAdmin && (stats?.pendingUsers ?? 0) > 0 ? [{
      title: "Wartende Benutzer",
      value: stats?.pendingUsers || 0,
      icon: UserPlus,
      color: "text-purple-500",
      testId: "stat-pending-users",
      clickable: true,
      onClick: () => setLocation('/team')
    }] : []),
    {
      title: "Wartende Urlaubsanträge",
      value: stats?.pendingRequests || 0,
      icon: Clock,
      color: "text-amber-500",
      testId: "stat-pending"
    },
    {
      title: "Genehmigt",
      value: stats?.approvedRequests || 0,
      icon: CheckCircle,
      color: "text-green-500",
      testId: "stat-approved"
    },
    {
      title: "Team Mitglieder",
      value: stats?.teamMembers || 0,
      icon: Users,
      color: "text-blue-500",
      testId: "stat-team"
    },
    {
      title: "Konflikte",
      value: stats?.conflicts || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      testId: "stat-conflicts"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
          >
            <Card className="card-hover">
              <CardContent className="p-5">
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isClickable = 'clickable' in card && card.clickable;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={'onClick' in card ? card.onClick : undefined}
            className={isClickable ? "cursor-pointer" : ""}
          >
            <Card className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <motion.div 
                    className="flex-shrink-0"
                    whileHover={{ 
                      rotate: [0, 5, -5, 0], 
                      scale: 1.1,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <Icon className={`h-8 w-8 ${card.color}`} />
                  </motion.div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        {card.title}
                      </dt>
                      <dd className="text-2xl font-bold text-foreground" data-testid={card.testId}>
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
