import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, UserPlus, Plus, Users, Shield, Mail, Trash2, AlertTriangle, Edit, Pencil } from "lucide-react";
import type { Organization, User } from "@shared/schema";

// Extended Organization type with admin count
type OrganizationWithAdminCount = Organization & { adminCount: number };
import AnimatedNavbar from "@/components/animated-navbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const createOrgSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  domain: z.string().min(1, "Domain ist erforderlich"),
});

const createAdminSchema = z.object({
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  firstName: z.string().min(1, "Vorname erforderlich"),
  lastName: z.string().min(1, "Nachname erforderlich"),
});

const renameOrgSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
});

const editAdminSchema = z.object({
  email: z.string().email("Ungültige E-Mail"),
  firstName: z.string().min(1, "Vorname erforderlich"),
  lastName: z.string().min(1, "Nachname erforderlich"),
});

type CreateOrgData = z.infer<typeof createOrgSchema>;
type CreateAdminData = z.infer<typeof createAdminSchema>;
type RenameOrgData = z.infer<typeof renameOrgSchema>;
type EditAdminData = z.infer<typeof editAdminSchema>;

export default function TenantAdmin() {
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [renameOrgOpen, setRenameOrgOpen] = useState(false);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Omit<User, 'password'> | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Omit<User, 'password'> | null>(null);

  // Fetch all organizations with admin counts
  const { data: organizations = [], isLoading: orgsLoading } = useQuery<OrganizationWithAdminCount[]>({
    queryKey: ['/api/tenant/organizations'],
  });

  // Fetch admins for selected organization
  const { data: admins = [], isLoading: adminsLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ['/api/tenant/organizations', selectedOrgId, 'admins'],
    enabled: !!selectedOrgId,
  });

  // Get selected organization details
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  const orgForm = useForm<CreateOrgData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", domain: "" },
  });

  const adminForm = useForm<CreateAdminData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "" },
  });

  const renameOrgForm = useForm<RenameOrgData>({
    resolver: zodResolver(renameOrgSchema),
    defaultValues: { name: "" },
  });

  const editAdminForm = useForm<EditAdminData>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: { email: "", firstName: "", lastName: "" },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrgData) => {
      const res = await apiRequest("POST", "/api/tenant/organizations", data);
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/organizations'] });
      toast({ title: "✅ Organisation erstellt" });
      orgForm.reset();
      setCreateOrgOpen(false);
      // Auto-select the newly created organization
      if (result.organization) {
        setSelectedOrgId(result.organization.id);
      }
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: CreateAdminData) => {
      if (!selectedOrgId) throw new Error("Keine Organisation ausgewählt");
      const res = await apiRequest("POST", `/api/tenant/organizations/${selectedOrgId}/admin`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/organizations', selectedOrgId, 'admins'] });
      toast({ title: "✅ Administrator erstellt" });
      adminForm.reset();
      setCreateAdminOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const renameOrgMutation = useMutation({
    mutationFn: async (data: RenameOrgData) => {
      if (!selectedOrgId) throw new Error("Keine Organisation ausgewählt");
      const res = await apiRequest("PATCH", `/api/tenant/organizations/${selectedOrgId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/organizations'] });
      toast({ title: "✅ Organisation umbenannt" });
      renameOrgForm.reset();
      setRenameOrgOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const editAdminMutation = useMutation({
    mutationFn: async (data: EditAdminData & { userId: string }) => {
      if (!selectedOrgId) throw new Error("Keine Organisation ausgewählt");
      const { userId, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/tenant/organizations/${selectedOrgId}/admins/${userId}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/organizations', selectedOrgId, 'admins'] });
      toast({ title: "✅ Administrator aktualisiert" });
      editAdminForm.reset();
      setEditAdminOpen(false);
      setEditingAdmin(null);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!selectedOrgId) throw new Error("Keine Organisation ausgewählt");
      const res = await apiRequest("DELETE", `/api/tenant/organizations/${selectedOrgId}/admins/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/organizations', selectedOrgId, 'admins'] });
      toast({ title: "✅ Administrator gelöscht" });
      setDeletingAdmin(null);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const res = await apiRequest("DELETE", `/api/tenant/organizations/${orgId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/organizations'] });
      toast({ title: "✅ Organisation gelöscht", description: "Organisation und alle zugehörigen Daten wurden erfolgreich entfernt" });
      setSelectedOrgId(null);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Filter out system organization
  const userOrgs = organizations.filter(o => o.domain !== 'system.local');

  return (
    <>
      <AnimatedNavbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Tenant Administration
            </h1>
            <p className="text-muted-foreground">Organisationen und Administratoren zentral verwalten</p>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT: Organizations List (Master) */}
            <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Organisationen
                    </CardTitle>
                    <CardDescription>{userOrgs.length} Organisation(en)</CardDescription>
                  </div>
                  <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                        data-testid="button-open-create-org"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Neu
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-create-org">
                      <DialogHeader>
                        <DialogTitle>Organisation erstellen</DialogTitle>
                        <DialogDescription>Neue Organisation im System anlegen</DialogDescription>
                      </DialogHeader>
                      <Form {...orgForm}>
                        <form onSubmit={orgForm.handleSubmit((data) => createOrgMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={orgForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organisationsname</FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme GmbH" {...field} data-testid="input-org-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={orgForm.control}
                            name="domain"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Domain</FormLabel>
                                <FormControl>
                                  <Input placeholder="acme.local" {...field} data-testid="input-org-domain" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" 
                            disabled={createOrgMutation.isPending}
                            data-testid="button-submit-create-org"
                          >
                            {createOrgMutation.isPending ? "Erstelle..." : "Organisation erstellen"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : userOrgs.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">Noch keine Organisationen</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCreateOrgOpen(true)}
                      data-testid="button-create-first-org"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Organisation erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {userOrgs.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => setSelectedOrgId(org.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 ${
                          selectedOrgId === org.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-md hover:scale-102'
                        }`}
                        data-testid={`org-card-${org.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1 truncate">{org.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{org.domain}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="secondary" className="whitespace-nowrap">
                              <Shield className="h-3 w-3 mr-1" />
                              {org.adminCount || 0}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Admin{org.adminCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIGHT: Organization Details (Detail) */}
            <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle>
                  {selectedOrg ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {selectedOrg.name}
                    </div>
                  ) : (
                    "Organisation auswählen"
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedOrg 
                    ? `Details und Administratoren für ${selectedOrg.name}` 
                    : "Wählen Sie eine Organisation aus der Liste"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedOrg ? (
                  <div className="text-center py-20">
                    <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                    <p className="text-muted-foreground text-lg mb-2">Keine Organisation ausgewählt</p>
                    <p className="text-sm text-muted-foreground">
                      Klicken Sie auf eine Organisation in der Liste links
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="admins" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="overview" data-testid="tab-overview">Übersicht</TabsTrigger>
                      <TabsTrigger value="admins" data-testid="tab-admins">Administratoren</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Organisationsname</h4>
                            <Dialog open={renameOrgOpen} onOpenChange={setRenameOrgOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    renameOrgForm.reset({ name: selectedOrg.name });
                                    setRenameOrgOpen(true);
                                  }}
                                  data-testid="button-rename-org"
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Umbenennen
                                </Button>
                              </DialogTrigger>
                              <DialogContent data-testid="dialog-rename-org">
                                <DialogHeader>
                                  <DialogTitle>Organisation umbenennen</DialogTitle>
                                  <DialogDescription>Geben Sie einen neuen Namen für die Organisation ein</DialogDescription>
                                </DialogHeader>
                                <Form {...renameOrgForm}>
                                  <form onSubmit={renameOrgForm.handleSubmit((data) => renameOrgMutation.mutate(data))} className="space-y-4">
                                    <FormField
                                      control={renameOrgForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Neuer Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} placeholder="Organisation GmbH" data-testid="input-org-name" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <Button
                                      type="submit"
                                      className="w-full"
                                      disabled={renameOrgMutation.isPending}
                                      data-testid="button-submit-rename-org"
                                    >
                                      {renameOrgMutation.isPending ? "Speichert..." : "Umbenennen"}
                                    </Button>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <p className="text-lg font-semibold">{selectedOrg.name}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Domain</h4>
                          <p className="text-lg font-semibold">{selectedOrg.domain}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Organisation ID</h4>
                          <p className="text-sm font-mono text-muted-foreground">{selectedOrg.id}</p>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="border-2 border-red-200 dark:border-red-900 rounded-lg p-4 mt-8">
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Gefahrenzone
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Das Löschen einer Organisation ist permanent und kann nicht rückgängig gemacht werden.
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700"
                              data-testid="button-delete-org"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Organisation löschen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-testid="dialog-confirm-delete">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Organisation wirklich löschen?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p className="font-semibold">
                                  Sie sind dabei, <span className="text-foreground">{selectedOrg.name}</span> zu löschen.
                                </p>
                                <p>
                                  Diese Aktion wird <strong>permanent</strong> alle folgenden Daten löschen:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>Alle Benutzer dieser Organisation</li>
                                  <li>Alle Urlaubsanträge</li>
                                  <li>Alle Benachrichtigungen</li>
                                  <li>Die Organisation selbst</li>
                                </ul>
                                <p className="text-red-600 font-semibold mt-4">
                                  ⚠️ Diese Aktion kann NICHT rückgängig gemacht werden!
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">
                                Abbrechen
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteOrgMutation.mutate(selectedOrg.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteOrgMutation.isPending}
                                data-testid="button-confirm-delete"
                              >
                                {deleteOrgMutation.isPending ? "Löscht..." : "Ja, endgültig löschen"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="admins" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Administratoren</h3>
                          <p className="text-sm text-muted-foreground">
                            {admins.length} Administrator(en)
                          </p>
                        </div>
                        <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                              data-testid="button-open-create-admin"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Administrator einladen
                            </Button>
                          </DialogTrigger>
                          <DialogContent data-testid="dialog-create-admin">
                            <DialogHeader>
                              <DialogTitle>Administrator einladen</DialogTitle>
                              <DialogDescription>
                                Neuen Administrator für {selectedOrg.name} erstellen
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...adminForm}>
                              <form onSubmit={adminForm.handleSubmit((data) => createAdminMutation.mutate(data))} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={adminForm.control}
                                    name="firstName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Vorname</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Max" {...field} data-testid="input-admin-firstname" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={adminForm.control}
                                    name="lastName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nachname</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Mustermann" {...field} data-testid="input-admin-lastname" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={adminForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>E-Mail</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="admin@example.com" {...field} data-testid="input-admin-email" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={adminForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Passwort</FormLabel>
                                      <FormControl>
                                        <Input type="password" placeholder="********" {...field} data-testid="input-admin-password" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button 
                                  type="submit" 
                                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                                  disabled={createAdminMutation.isPending}
                                  data-testid="button-submit-create-admin"
                                >
                                  {createAdminMutation.isPending ? "Erstelle..." : "Administrator erstellen"}
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {adminsLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => (
                            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : admins.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                          <p className="text-muted-foreground mb-4">
                            Noch keine Administratoren für diese Organisation
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => setCreateAdminOpen(true)}
                            data-testid="button-create-first-admin"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Ersten Administrator einladen
                          </Button>
                        </div>
                      ) : (
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>E-Mail</TableHead>
                                <TableHead>Rolle</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {admins.map((admin) => (
                                <TableRow key={admin.id} data-testid={`admin-row-${admin.id}`}>
                                  <TableCell className="font-medium">
                                    {admin.firstName} {admin.lastName}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-4 w-4" />
                                      {admin.email}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={admin.role === 'tenant_admin' ? 'default' : 'secondary'}>
                                      <Shield className="h-3 w-3 mr-1" />
                                      {admin.role === 'tenant_admin' ? 'Tenant Admin' : 'Admin'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={admin.status === 'approved' ? 'default' : 'outline'}>
                                      {admin.status === 'approved' ? 'Aktiv' : admin.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingAdmin(admin);
                                          editAdminForm.reset({
                                            email: admin.email,
                                            firstName: admin.firstName,
                                            lastName: admin.lastName,
                                          });
                                          setEditAdminOpen(true);
                                        }}
                                        data-testid={`button-edit-admin-${admin.id}`}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Bearbeiten
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setDeletingAdmin(admin)}
                                        data-testid={`button-delete-admin-${admin.id}`}
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Löschen
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Admin Dialog */}
      <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
        <DialogContent data-testid="dialog-edit-admin">
          <DialogHeader>
            <DialogTitle>Administrator bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Daten des Administrators
            </DialogDescription>
          </DialogHeader>
          <Form {...editAdminForm}>
            <form onSubmit={editAdminForm.handleSubmit((data) => {
              if (editingAdmin) {
                editAdminMutation.mutate({ ...data, userId: editingAdmin.id });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editAdminForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-firstname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editAdminForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editAdminForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={editAdminMutation.isPending}
                data-testid="button-submit-edit-admin"
              >
                {editAdminMutation.isPending ? "Speichert..." : "Änderungen speichern"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Confirmation Dialog */}
      <AlertDialog open={!!deletingAdmin} onOpenChange={(open) => !open && setDeletingAdmin(null)}>
        <AlertDialogContent data-testid="dialog-delete-admin">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Administrator wirklich löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAdmin && (
                <>
                  <p className="font-semibold mb-2">
                    Sie sind dabei, <span className="text-foreground">{deletingAdmin.firstName} {deletingAdmin.lastName}</span> ({deletingAdmin.email}) zu löschen.
                  </p>
                  <p>
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-admin">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAdmin) {
                  deleteAdminMutation.mutate(deletingAdmin.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAdminMutation.isPending}
              data-testid="button-confirm-delete-admin"
            >
              {deleteAdminMutation.isPending ? "Löscht..." : "Ja, löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
