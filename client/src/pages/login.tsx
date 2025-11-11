import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      const message = error.message || "Anmeldung fehlgeschlagen";
      setErrorMessage(message);
      toast({
        title: "Anmeldefehler",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setErrorMessage("");
    loginMutation.mutate(data);
  };

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
            Anmelden
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Melden Sie sich an, um auf Ihr Urlaubskonto zuzugreifen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {errorMessage && (
                <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Noch kein Konto?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-primary hover:underline font-medium"
                data-testid="link-register"
              >
                Registrieren
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
