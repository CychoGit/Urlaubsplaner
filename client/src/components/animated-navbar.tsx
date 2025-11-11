import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown, BarChart3, Settings, Menu, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnimatedNavbar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Helper to check if a nav item is active
  const isNavItemActive = (itemPath: string) => {
    // Special case: Verfügbarkeit tab should be active for both "/" and "/availability"
    if (itemPath === "/availability" && (location === "/" || location === "/availability")) {
      return true;
    }
    return location === itemPath;
  };

  const baseNavItems: Array<{ href: string; label: string; path: string; icon?: any }> = [
    { href: "/", label: "Verfügbarkeit", path: "/availability" },
    { href: "/dashboard", label: "Dashboard", path: "/dashboard" },
    { href: "/requests", label: "Meine Anträge", path: "/requests" },
    { href: "/team", label: "Team Übersicht", path: "/team" },
  ];

  const adminNavItems: Array<{ href: string; label: string; path: string; icon?: any }> = [
    { href: "/analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
  ];

  const tenantAdminNavItems: Array<{ href: string; label: string; path: string; icon?: any }> = [
    { href: "/tenant-admin", label: "Tenant Admin", path: "/tenant-admin", icon: Shield },
  ];

  // Tenant Admins get all nav items including their special admin section
  const navItems = user?.role === "tenant_admin"
    ? [...baseNavItems, ...tenantAdminNavItems]
    : user?.role === "admin"
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  const navbarVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        staggerChildren: 0.1,
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.2 }
    }
  };

  const navItemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      }
    }
  };

  return (
    <motion.nav 
      className="bg-card shadow-sm border-b border-border card-hover"
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      style={{ background: "var(--card)" }}
    >
      {/* Header-Zeile mit Logo und Mobile Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0 flex items-center"
            variants={logoVariants}
            whileHover="hover"
          >
            {user?.organization?.logoUrl ? (
              <motion.div
                animate={{
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="mr-3"
              >
                <img 
                  src={user.organization.logoUrl} 
                  alt="Organization Logo" 
                  className="h-10 w-auto object-contain max-w-[120px]" 
                  data-testid="img-org-logo"
                />
              </motion.div>
            ) : (
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Calendar className="h-8 w-8 text-primary mr-3 glow-effect" />
              </motion.div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground gradient-text" data-testid="text-org-name">
              {user?.organization?.customName || user?.organization?.name || "Team Urlaubsplaner"}
            </h1>
          </motion.div>

          {/* Desktop User Menu */}
          <motion.div 
            className="hidden md:flex items-center space-x-4"
            variants={navItemVariants}
          >
            <AnimatePresence>
              {user?.role === "tenant_admin" && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Badge className="bg-purple-100 text-purple-800 animate-pulse glow-effect">
                    Tenant Admin
                  </Badge>
                </motion.div>
              )}
              {user?.role === "admin" && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Badge className="bg-blue-100 text-blue-800 animate-pulse glow-effect">
                    Administrator
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" className="flex items-center space-x-2 button-secondary" data-testid="button-user-menu">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl ?? undefined} />
                        <AvatarFallback className="gradient-text">
                          {getInitials(user?.firstName, user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <span className="text-sm text-foreground hidden lg:block">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/settings/user'}
                  className="hover:bg-accent transition-colors duration-200"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Meine Einstellungen
                </DropdownMenuItem>
                {(user?.role === 'admin' || user?.role === 'tenant_admin') && (
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/settings/organization'}
                    className="hover:bg-accent transition-colors duration-200"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Organisations-Einstellungen
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/settings'}
                  className="hover:bg-accent transition-colors duration-200"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Theme & Benachrichtigungen
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/login';
                    } catch (error) {
                      console.error('Logout failed:', error);
                      window.location.href = '/login';
                    }
                  }}
                  data-testid="button-logout"
                  className="hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                >
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>

          {/* Mobile Burger Button */}
          <motion.div 
            className="md:hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
              data-testid="button-mobile-menu"
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Desktop Navigation-Zeile */}
      <motion.div 
        className="hidden md:block border-t border-border/50"
        variants={navItemVariants}
        style={{ background: "var(--accent)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <AnimatePresence>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href={item.href}
                    className={cn(
                      "navbar-item inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold gap-2 transition-all duration-200",
                      isNavItemActive(item.path)
                        ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg border-2 border-primary/20 glow-effect"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    data-testid={`nav-${item.path === "/analytics" ? "analytics" : item.path}`}
                  >
                    {item.icon && (
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <item.icon className="h-5 w-5" />
                      </motion.div>
                    )}
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border/50 bg-card"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Navigation Items */}
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg text-base font-semibold gap-3 transition-all duration-200 w-full",
                      isNavItemActive(item.path)
                        ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg border-2 border-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid={`nav-mobile-${item.path === "/analytics" ? "analytics" : item.path}`}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              {/* Mobile User Section */}
              <div className="border-t border-border/50 pt-4 mt-4">
                {user?.role === "tenant_admin" && (
                  <div className="px-4 py-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      Tenant Admin
                    </Badge>
                  </div>
                )}
                {user?.role === "admin" && (
                  <div className="px-4 py-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      Administrator
                    </Badge>
                  </div>
                )}
                
                <div className="px-4 py-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl ?? undefined} />
                      <AvatarFallback className="gradient-text">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={() => {
                        window.location.href = '/settings';
                        setIsMobileMenuOpen(false);
                      }}
                      data-testid="button-mobile-settings"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Einstellungen
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={async () => {
                        try {
                          await fetch('/api/auth/logout', { method: 'POST' });
                          window.location.href = '/login';
                        } catch (error) {
                          console.error('Logout failed:', error);
                          window.location.href = '/login';
                        }
                      }}
                      data-testid="button-mobile-logout"
                    >
                      Abmelden
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}