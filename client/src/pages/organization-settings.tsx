import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import AnimatedNavbar from "@/components/animated-navbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Upload, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Organization } from "@shared/schema";

export default function OrganizationSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [defaultVacationDays, setDefaultVacationDays] = useState<number>(30);
  const [vacationTrackingEnabled, setVacationTrackingEnabled] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ['/api/organizations', user?.organizationId],
    enabled: isAuthenticated && !!user?.organizationId,
  });

  useEffect(() => {
    if (organization?.defaultVacationDays) {
      setDefaultVacationDays(organization.defaultVacationDays);
    }
    if (organization?.vacationTrackingEnabled !== undefined) {
      setVacationTrackingEnabled(organization.vacationTrackingEnabled);
    }
    if (organization?.logoUrl) {
      setLogoUrl(organization.logoUrl);
    }
  }, [organization]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bilddatei aus (PNG, JPG, GIF, SVG oder WebP).",
        variant: "destructive",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "Datei zu groß",
        description: `Die Datei ist ${sizeMB}MB groß. Maximal erlaubt sind 5MB.`,
        variant: "destructive",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get presigned URL from backend
      let presignedRes, uploadUrl, objectUrl;
      try {
        presignedRes = await apiRequest('POST', '/api/object-storage/presigned-url', {
          fileName: file.name,
          contentType: file.type,
          folder: 'logos',
        });
        const data = await presignedRes.json();
        uploadUrl = data.uploadUrl;
        objectUrl = data.objectUrl;
      } catch (err) {
        throw new Error('Fehler beim Anfordern der Upload-URL. Bitte versuchen Sie es erneut.');
      }

      // Step 2: Upload file to object storage
      try {
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload fehlgeschlagen (Status: ${uploadRes.status})`);
        }
      } catch (err: any) {
        if (err.message.includes('Status:')) {
          throw err;
        }
        throw new Error('Netzwerkfehler beim Hochladen. Bitte überprüfen Sie Ihre Internetverbindung.');
      }

      // Step 3: Set ACL policy to make the logo publicly accessible
      let objectPath = objectUrl; // Use objectUrl as fallback
      try {
        const aclRes = await apiRequest('POST', '/api/object-storage/set-logo-acl', {
          uploadUrl,
        });
        const data = await aclRes.json();
        objectPath = data.objectPath;
      } catch (err) {
        // ACL setting failed, but logo should still work
        console.warn('ACL setting failed:', err);
        // Continue with objectUrl as the path
      }

      // Update logo URL in state
      setLogoUrl(objectPath);
      
      toast({
        title: "✅ Logo erfolgreich hochgeladen",
        description: "Klicken Sie auf 'Einstellungen speichern', um das Logo dauerhaft zu übernehmen.",
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "❌ Upload fehlgeschlagen",
        description: error.message || "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      // Reset logo URL on error
      setLogoUrl(organization?.logoUrl || "");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { defaultVacationDays: number; vacationTrackingEnabled: boolean; logoUrl?: string }) => {
      if (!user?.organizationId) throw new Error("No organization");
      return await apiRequest('PATCH', `/api/organizations/${user.organizationId}/settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', user?.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Einstellungen gespeichert",
        description: "Die Organisations-Einstellungen wurden erfolgreich aktualisiert.",
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
    if (defaultVacationDays < 1 || defaultVacationDays > 365) {
      toast({
        title: "Ungültiger Wert",
        description: "Urlaubstage müssen zwischen 1 und 365 liegen.",
        variant: "destructive",
      });
      return;
    }
    updateSettingsMutation.mutate({ 
      defaultVacationDays,
      vacationTrackingEnabled,
      logoUrl: logoUrl || undefined
    });
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
  };

  if (isLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'tenant_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nur Administratoren haben Zugriff auf diese Seite.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AnimatedNavbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Organisations-Einstellungen
            </h1>
          </div>
          <p className="text-muted-foreground">
            Verwalten Sie die Standardeinstellungen für Ihre Organisation
          </p>
        </div>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle>Organisations-Branding</CardTitle>
            <CardDescription>
              Personalisieren Sie das Erscheinungsbild Ihrer Organisation mit einem Logo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Organisations-Logo</Label>
                {logoUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={logoUrl} 
                        alt="Organization Logo" 
                        className="h-20 w-auto object-contain max-w-[200px] border rounded-lg p-2"
                        data-testid="img-current-logo"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        data-testid="button-remove-logo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Kein Logo hochgeladen</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="input-file-logo"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-2"
                  data-testid="button-upload-logo"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoUrl ? "Logo ändern" : "Logo hochladen"}
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Empfohlene Formate: PNG, JPG, SVG (max. 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 mt-6">
          <CardHeader>
            <CardTitle>Standard-Urlaubstage</CardTitle>
            <CardDescription>
              Legen Sie die Standard-Anzahl der jährlichen Urlaubstage für alle Mitarbeiter fest.
              Einzelne Mitarbeiter können dies in ihren persönlichen Einstellungen anpassen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-0.5">
                  <Label htmlFor="vacationTrackingEnabled" className="text-base font-semibold">
                    Urlaubssaldo-Tracking aktivieren
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ermöglicht es Mitarbeitern, ihre Urlaubstage zu tracken und den aktuellen Saldo anzuzeigen
                  </p>
                </div>
                <Switch
                  id="vacationTrackingEnabled"
                  checked={vacationTrackingEnabled}
                  onCheckedChange={setVacationTrackingEnabled}
                  data-testid="switch-org-vacation-tracking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultVacationDays">
                  Standard-Urlaubstage pro Jahr
                </Label>
                <Input
                  id="defaultVacationDays"
                  type="number"
                  min="1"
                  max="365"
                  value={defaultVacationDays}
                  onChange={(e) => setDefaultVacationDays(parseInt(e.target.value) || 0)}
                  className="max-w-xs"
                  data-testid="input-default-vacation-days"
                />
                <p className="text-sm text-muted-foreground">
                  Empfohlene Werte: 20-30 Tage je nach Land und Betriebszugehörigkeit
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-300">
                  💡 Hinweis
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Dieser Wert gilt als Standard für alle neuen und bestehenden Mitarbeiter, 
                  die keine individuellen Urlaubstage eingestellt haben. Mitarbeiter können 
                  ihre persönlichen Urlaubstage in ihren Einstellungen anpassen 
                  (z.B. +2 Tage für Betriebszugehörigkeit, +5 Tage für Schwerbehinderung).
                </p>
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

        {organization && (
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle>Aktuelle Konfiguration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Organisation:</span>
                <span>{organization.customName || organization.name}</span>
                
                <span className="font-medium">Standard-Urlaubstage:</span>
                <span className="font-semibold text-primary">
                  {organization.defaultVacationDays} Tage
                </span>
                
                {organization.domain && (
                  <>
                    <span className="font-medium">Domain:</span>
                    <span className="text-muted-foreground">{organization.domain}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
