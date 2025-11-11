import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, CheckCircle, XCircle, Clock, Building2, Upload, Image as ImageIcon } from "lucide-react";
import type { User, Organization } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Record<string, 'admin' | 'employee'>>({});
  const [customName, setCustomName] = useState("");
  const [logoURL, setLogoURL] = useState<string | null>(null);

  const { data: pendingUsers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/pending'],
    enabled: currentUser?.role === 'admin' || currentUser?.role === 'tenant_admin',
  });

  // Fetch organization data for branding
  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ['/api/organizations', currentUser?.organizationId],
    enabled: !!currentUser?.organizationId && currentUser?.role === 'admin',
  });

  // Hydrate form when organization data is loaded
  useEffect(() => {
    if (organization) {
      setCustomName(organization.customName || "");
      setLogoURL(organization.logoUrl || "");
    }
  }, [organization]);

  const approveMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role?: 'admin' | 'employee' }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/approve`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: "Benutzer genehmigt",
        description: "Der Benutzer wurde erfolgreich genehmigt",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Genehmigen des Benutzers",
        variant: "destructive",
      });
    },
  });

  const brandingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.organizationId) throw new Error("No organization");
      const res = await apiRequest("PUT", `/api/organizations/${currentUser.organizationId}/branding`, {
        customName: customName.trim() || null,
        logoURL: logoURL?.trim() || null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', currentUser?.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Branding aktualisiert",
        description: "Organisation branding wurde erfolgreich aktualisiert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Aktualisieren des Brandings",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    const role = selectedRole[userId] || 'employee';
    approveMutation.mutate({ userId, role });
  };

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'tenant_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-6 w-6" />
              Zugriff verweigert
            </CardTitle>
            <CardDescription>
              Sie haben keine Berechtigung, diese Seite anzuzeigen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Benutzer und Organisations-Branding
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Benutzer
          </TabsTrigger>
          <TabsTrigger value="branding" data-testid="tab-branding">
            <ImageIcon className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="shadow-md hover:shadow-lg transition-shadow" data-testid={`card-pending-user-${user.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {user.firstName} {user.lastName}
                          </CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Ausstehend
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Rolle zuweisen
                        </label>
                        <Select
                          value={selectedRole[user.id] || 'employee'}
                          onValueChange={(value) => 
                            setSelectedRole({ ...selectedRole, [user.id]: value as 'admin' | 'employee' })
                          }
                        >
                          <SelectTrigger data-testid={`select-role-${user.id}`}>
                            <SelectValue placeholder="Rolle wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Mitarbeiter</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => handleApprove(user.id)}
                        disabled={approveMutation.isPending}
                        className="mt-6"
                        data-testid={`button-approve-${user.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Genehmigen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-md">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Keine ausstehenden Benutzer
                </h3>
                <p className="text-muted-foreground">
                  Alle Benutzerregistrierungen wurden verarbeitet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          {orgLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organisations-Branding
                </CardTitle>
                <CardDescription>
                  Passen Sie das Erscheinungsbild Ihrer Organisation an
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customName">Anzeigename</Label>
                  <Input
                    id="customName"
                    placeholder={organization?.name || "Name der Organisation"}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    data-testid="input-custom-name"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leer lassen um den Standard-Namen "{organization?.name}" zu verwenden
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoInput">Logo URL</Label>
                  <Input
                    id="logoInput"
                    placeholder="https://example.com/logo.png"
                    value={logoURL || ""}
                    onChange={(e) => setLogoURL(e.target.value)}
                    data-testid="input-logo-url"
                  />
                  <p className="text-sm text-muted-foreground">
                    Geben Sie die URL eines öffentlich zugänglichen Logos ein
                  </p>
                  {logoURL && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Vorschau:</p>
                      <img 
                        src={logoURL} 
                        alt="Logo Preview" 
                        className="h-20 w-auto object-contain border rounded-md p-2"
                        data-testid="img-logo-preview"
                      />
                    </div>
                  )}
                  {organization?.logoUrl && !logoURL && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Aktuelles Logo:</p>
                      <img 
                        src={organization.logoUrl} 
                        alt="Current Logo" 
                        className="h-20 w-auto object-contain border rounded-md p-2"
                        data-testid="img-current-logo"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => brandingMutation.mutate()}
                  disabled={brandingMutation.isPending || orgLoading}
                  className="w-full"
                  data-testid="button-save-branding"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {brandingMutation.isPending ? "Wird gespeichert..." : "Branding speichern"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
