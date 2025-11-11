import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Shield, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-foreground">Team Urlaubsplaner</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                onClick={() => setLocation('/register')} 
                data-testid="button-register"
              >
                Registrieren
              </Button>
              <Button 
                onClick={() => setLocation('/login')} 
                data-testid="button-login"
              >
                Anmelden
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
            Team Urlaubsplanung
            <span className="block text-primary">einfach gemacht</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground">
            Verwalten Sie Urlaubszeiten übersichtlich, erkennen Sie Überschneidungen automatisch 
            und geben Sie Ihrem Team eine einfache Übersicht über alle Termine.
          </p>
          <div className="mt-10">
            <Button 
              size="lg" 
              onClick={() => setLocation('/register')}
              data-testid="button-get-started"
            >
              Jetzt starten
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-lg">Benutzerverwaltung</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm line-clamp-3">
                  Einfache Anmeldung für alle Teammitglieder mit Rollen-basierter Zugriffskontrolle
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-lg">Kalender Integration</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm line-clamp-3">
                  Übersichtliche Kalenderansicht mit farbcodierten Urlaubszeiten pro Mitarbeiter
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-lg">Genehmigungsworkflow</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm line-clamp-3">
                  Administratoren können Urlaubsanträge genehmigen oder ablehnen mit automatischen Benachrichtigungen
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-lg">Konflikt-Erkennung</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm line-clamp-3">
                  Automatische Prüfung auf Überschneidungen mit anderen Teammitgliedern
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
