import { motion, AnimatePresence } from "framer-motion";
import { useTheme, type ThemePreference } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AnimatedNavbar from "@/components/animated-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Palette, Moon, Sun, Monitor, CheckCircle, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
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

const themeCardVariants = {
  rest: { scale: 1, rotateY: 0 },
  hover: { 
    scale: 1.03,
    rotateY: 5,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  tap: { scale: 0.97 }
};

const themes: Array<{
  key: ThemePreference;
  name: string;
  description: string;
  colors: string[];
  gradient: string;
  icon: string;
}> = [
  {
    key: 'modern',
    name: 'Modern',
    description: 'Saubere Gradients mit Blau/Lila, subtile Schatten',
    colors: ['#3b82f6', '#8b5cf6', '#06b6d4'],
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    icon: '💎'
  },
  {
    key: 'elegant',
    name: 'Elegant',  
    description: 'Warme Gold/Rose Töne, elegante Typografie',
    colors: ['#f59e0b', '#ec4899', '#f97316'],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
    icon: '🌹'
  },
  {
    key: 'vibrant',
    name: 'Vibrant',
    description: 'Lebendige Grün/Orange, dynamische Animationen',
    colors: ['#10b981', '#f97316', '#06b6d4'],
    gradient: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)',
    icon: '⚡'
  }
];

export default function Settings() {
  const { theme, darkMode, setTheme, setDarkMode, isLoading } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [previewTheme, setPreviewTheme] = useState<ThemePreference | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated]);

  const handleThemeSelect = (newTheme: ThemePreference) => {
    setTheme(newTheme);
    setPreviewTheme(null);
    toast({
      title: "Theme aktualisiert",
      description: `${themes.find(t => t.key === newTheme)?.name} Theme erfolgreich ausgewählt.`,
    });
  };

  const handleThemePreview = (themeKey: ThemePreference) => {
    setPreviewTheme(themeKey);
    document.documentElement.setAttribute('data-theme', themeKey);
  };

  const handlePreviewEnd = () => {
    setPreviewTheme(null);
    document.documentElement.setAttribute('data-theme', theme);
  };

  if (!isAuthenticated) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-full theme-bg-pattern"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatedNavbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div variants={cardVariants}>
          <div className="mb-8">
            <motion.h1 
              className="text-3xl font-bold text-foreground gradient-text"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Palette className="inline mr-3" />
              Einstellungen
            </motion.h1>
            <motion.p 
              className="text-muted-foreground mt-2"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Personalisiere dein Theme und Darstellungseinstellungen
            </motion.p>
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* Theme Selection */}
          <motion.div variants={cardVariants}>
            <Card className="card-hover glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>
                  Theme Auswahl
                </CardTitle>
                <CardDescription>
                  Wähle dein bevorzugtes Farbschema. Die Änderung wird automatisch gespeichert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {themes.map((themeOption, index) => (
                    <motion.div
                      key={themeOption.key}
                      variants={themeCardVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      onHoverStart={() => handleThemePreview(themeOption.key)}
                      onHoverEnd={handlePreviewEnd}
                      className="relative cursor-pointer"
                      onClick={() => handleThemeSelect(themeOption.key)}
                    >
                      <Card className={`border-2 transition-all duration-300 ${
                        theme === themeOption.key 
                          ? 'border-primary shadow-lg glow-effect' 
                          : 'border-border hover:border-primary/50'
                      } ${previewTheme === themeOption.key ? 'ring-2 ring-primary/30' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-2xl">{themeOption.icon}</div>
                            <AnimatePresence>
                              {theme === themeOption.key && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 90 }}
                                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                >
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-2">{themeOption.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{themeOption.description}</p>
                          
                          {/* Color Preview */}
                          <div className="flex space-x-2 mb-4">
                            {themeOption.colors.map((color, colorIndex) => (
                              <motion.div
                                key={colorIndex}
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: color }}
                                whileHover={{ scale: 1.2 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              />
                            ))}
                          </div>

                          {/* Gradient Preview */}
                          <motion.div
                            className="w-full h-3 rounded-full mb-3"
                            style={{ background: themeOption.gradient }}
                            animate={{ 
                              boxShadow: theme === themeOption.key 
                                ? '0 0 20px rgba(59, 130, 246, 0.5)' 
                                : 'none' 
                            }}
                          />

                          {theme === themeOption.key && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-primary font-medium"
                            >
                              Aktives Theme
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                
                {previewTheme && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-accent/50 rounded-lg text-center text-sm text-accent-foreground"
                  >
                    Vorschau: {themes.find(t => t.key === previewTheme)?.name} Theme
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.div variants={cardVariants}>
            <Card className="card-hover glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: darkMode === 'dark' ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {darkMode === 'dark' ? (
                      <Moon className="h-5 w-5 text-primary" />
                    ) : (
                      <Sun className="h-5 w-5 text-primary" />
                    )}
                  </motion.div>
                  Darstellungsmodus
                </CardTitle>
                <CardDescription>
                  Wähle zwischen hellem und dunklem Modus oder folge den Systemeinstellungen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between space-y-4">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    {[
                      { key: 'light', label: 'Hell', icon: Sun },
                      { key: 'dark', label: 'Dunkel', icon: Moon },
                      { key: 'system', label: 'System', icon: Monitor }
                    ].map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <motion.button
                          key={mode.key}
                          onClick={() => setDarkMode(mode.key as any)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            darkMode === mode.key
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{mode.label}</div>
                          {darkMode === mode.key && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-2"
                            >
                              <CheckCircle className="h-4 w-4 mx-auto" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Info */}
          <motion.div variants={cardVariants}>
            <Card className="card-hover glass-card">
              <CardHeader>
                <CardTitle>Benutzerinformationen</CardTitle>
                <CardDescription>
                  Deine aktuellen Kontoinformationen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">E-Mail:</span>
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rolle:</span>
                    <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                      {user?.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Abteilung:</span>
                    <span className="text-sm capitalize">{user?.department}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}