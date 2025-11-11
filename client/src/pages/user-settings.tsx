import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AnimatedNavbar from "@/components/animated-navbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User2, Info, KeyRound } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Organization, VacationBalance } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(8, "Neues Passwort muss mindestens 8 Zeichen lang sein"),
  confirmPassword: z.string().min(1, "Passwort-Bestätigung ist erforderlich"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function UserSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [customVacationDays, setCustomVacationDays] = useState<number | null>(null);
  const [vacationTrackingEnabled, setVacationTrackingEnabled] = useState<boolean>(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', user?.organizationId],
    enabled: isAuthenticated && !!user?.organizationId,
  });

  const { data: balance } = useQuery<VacationBalance>({
    queryKey: ['/api/users', user?.id, 'balance'],
    enabled: isAuthenticated && !!user?.id,
  });

  useEffect(() => {
    if (user?.customVacationDays !== undefined && user?.customVacationDays !== null) {
      setCustomVacationDays(user.customVacationDays);
    }
    if (user?.vacationTrackingEnabled !== undefined) {
      setVacationTrackingEnabled(user.vacationTrackingEnabled);
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { customVacationDays: number | null }) => {
      return await apiRequest('PATCH', '/api/users/me/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre persönlichen Urlaubstage wurden erfolgreich aktualisiert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Einstellungen.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customVacationDays !== null && (customVacationDays < 1 || customVacationDays > 365)) {
      toast({
        title: "Ungültiger Wert",
        description: "Urlaubstage müssen zwischen 1 und 365 liegen.",
        variant: "destructive",
      });
      return;
    }
    
    updateSettingsMutation.mutate({ customVacationDays });
  };

  const resetToDefault = () => {
    setCustomVacationDays(null);
    updateSettingsMutation.mutate({ customVacationDays: null });
  };

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      return await apiRequest('POST', '/api/auth/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich aktualisiert.",
      });
      passwordForm.reset();
      setChangePasswordOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Ändern des Passworts.",
        variant: "destructive",
      });
    },
  });

  const vacationTrackingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest('PATCH', '/api/auth/user/vacation-tracking', { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Einstellung gespeichert",
        description: "Ihre Urlaubssaldo-Tracking-Einstellung wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Einstellung.",
        variant: "destructive",
      });
      // Revert the switch state on error
      setVacationTrackingEnabled(!vacationTrackingEnabled);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Bitte melden Sie sich an.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultDays = organization?.defaultVacationDays || 30;
  const effectiveDays = customVacationDays ?? defaultDays;
  const isUsingDefault = customVacationDays === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AnimatedNavbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meine Einstellungen
            </h1>
          </div>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre persönlichen Urlaubstage und Sicherheitseinstellungen
          </p>
        </div>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle>Persönliche Urlaubstage</CardTitle>
            <CardDescription>
              Passen Sie Ihre jährlichen Urlaubstage individuell an. 
              Wenn nicht angegeben, gilt der Organisations-Standard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Organisations-Standard: <span className="text-primary font-bold">{defaultDays} Tage</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isUsingDefault ? "Sie verwenden aktuell den Standard-Wert." : "Sie haben einen individuellen Wert festgelegt."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customVacationDays">
                    Individuelle Urlaubstage (optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="customVacationDays"
                      type="number"
                      min="1"
                      max="365"
                      value={customVacationDays ?? ''}
                      onChange={(e) => setCustomVacationDays(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder={`Standard: ${defaultDays}`}
                      className="max-w-xs"
                      data-testid="input-custom-vacation-days"
                    />
                    {!isUsingDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetToDefault}
                        data-testid="button-reset-to-default"
                      >
                        Auf Standard zurücksetzen
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lassen Sie dies leer, um den Organisations-Standard zu verwenden
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-300">
                  💡 Beispiele für Anpassungen
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>+2 Tage für langjährige Betriebszugehörigkeit</li>
                  <li>+5 Tage bei Schwerbehinderung</li>
                  <li>Länderspezifische Regelungen</li>
                  <li>Individuelle Vereinbarungen im Arbeitsvertrag</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? "Wird gespeichert..." : "Einstellungen speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {balance && (
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle>Aktuelle Urlaubsbilanz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Gesamt-Urlaubstage:</span>
                <span className="font-semibold text-primary">
                  {effectiveDays} Tage
                </span>
                
                <span className="font-medium">Verbrauchte Tage:</span>
                <span className="text-muted-foreground">{balance.usedDays} Tage</span>
                
                <span className="font-medium">Verbleibende Tage:</span>
                <span className={`font-semibold ${balance.remainingDays > 10 ? 'text-green-600 dark:text-green-400' : balance.remainingDays > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {balance.remainingDays} Tage
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {organization?.vacationTrackingEnabled && (
          <Card className="mt-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Urlaubssaldo-Tracking</CardTitle>
              <CardDescription>
                Aktivieren Sie die Anzeige Ihres aktuellen Urlaubssaldos auf dem Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-0.5">
                  <Label htmlFor="user-vacation-tracking" className="text-base font-semibold">
                    Urlaubssaldo-Tracking aktivieren
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Zeigt Ihren aktuellen Urlaubssaldo auf dem Dashboard an
                  </p>
                </div>
                <Switch
                  id="user-vacation-tracking"
                  checked={vacationTrackingEnabled}
                  onCheckedChange={(checked) => {
                    setVacationTrackingEnabled(checked);
                    vacationTrackingMutation.mutate(checked);
                  }}
                  disabled={vacationTrackingMutation.isPending}
                  data-testid="switch-user-vacation-tracking"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle>Sicherheit</CardTitle>
            <CardDescription>
              Verwalten Sie Ihre Sicherheitseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-open-change-password"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Passwort ändern
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-change-password">
                <DialogHeader>
                  <DialogTitle>Passwort ändern</DialogTitle>
                  <DialogDescription>
                    Geben Sie Ihr aktuelles Passwort und Ihr neues Passwort zweimal ein
                  </DialogDescription>
                </DialogHeader>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aktuelles Passwort</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} data-testid="input-current-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neues Passwort</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} data-testid="input-new-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neues Passwort bestätigen</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} data-testid="input-confirm-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={changePasswordMutation.isPending}
                      data-testid="button-submit-change-password"
                    >
                      {changePasswordMutation.isPending ? "Wird geändert..." : "Passwort ändern"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
