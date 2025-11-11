import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Organization } from "@shared/schema";

const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .max(100, "Passwort ist zu lang"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Vorname ist erforderlich").max(100),
  lastName: z.string().min(1, "Nachname ist erforderlich").max(100),
  organizationId: z.string().min(1, "Bitte wählen Sie eine Organisation"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Load organizations
  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      organizationId: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      const res = await apiRequest("POST", "/api/auth/register", registerData);
      return await res.json();
    },
    onSuccess: (data: any) => {
      setSuccessMessage(data.message);
      setRequiresApproval(data.requiresApproval);
      toast({
        title: "Registrierung erfolgreich",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registrierungsfehler",
        description: error.message || "Registrierung fehlgeschlagen",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 flex items-center justify-center p-4">
        <div className="absolute top-8 left-8">
          <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
            <Calendar className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-xl font-bold text-foreground">Team Urlaubsplaner</h1>
          </div>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Registrierung erfolgreich!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {successMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiresApproval && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Ihr Konto muss von einem Administrator genehmigt werden, bevor Sie sich anmelden können.
                </p>
              </div>
            )}
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
              data-testid="button-go-to-login"
            >
              Zur Anmeldung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
          <Calendar className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-xl font-bold text-foreground">Team Urlaubsplaner</h1>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Registrieren
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Erstellen Sie ein Konto, um loszulegen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Max"
                          data-testid="input-firstname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mustermann"
                          data-testid="input-lastname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ihre.email@beispiel.de"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort bestätigen</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-confirm-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-organization">
                          <SelectValue placeholder="Wählen Sie Ihre Organisation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgsLoading && (
                          <SelectItem value="loading" disabled>Lädt...</SelectItem>
                        )}
                        {!orgsLoading && organizations.length === 0 && (
                          <SelectItem value="none" disabled>Keine Organisationen verfügbar</SelectItem>
                        )}
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Wählen Sie die Organisation, der Sie beitreten möchten
                    </p>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-submit"
              >
                {registerMutation.isPending ? "Registrieren..." : "Registrieren"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Bereits ein Konto?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-primary hover:underline font-medium"
                data-testid="link-login"
              >
                Anmelden
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
