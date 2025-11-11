import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Settings, Save, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string;
  annualAllowance: number;
  usedDays: number;
  remainingDays: number;
}

const balanceUpdateSchema = z.object({
  annualAllowance: z.number().int().min(0).max(365),
});

type BalanceUpdate = z.infer<typeof balanceUpdateSchema>;

export default function AdminBalanceManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users/balance/all'],
  });

  const form = useForm<BalanceUpdate>({
    resolver: zodResolver(balanceUpdateSchema),
    defaultValues: {
      annualAllowance: 25,
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: (data: { userId: string; balance: BalanceUpdate }) =>
      apiRequest('PUT', `/api/users/${data.userId}/balance`, data.balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/balance/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/balance'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      form.reset();
      toast({
        title: "Erfolgreich aktualisiert",
        description: "Das Urlaubskontingent wurde erfolgreich angepasst.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message || "Das Urlaubskontingent konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const handleEditBalance = (user: User) => {
    setSelectedUser(user);
    form.setValue('annualAllowance', user.annualAllowance);
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: BalanceUpdate) => {
    if (selectedUser) {
      updateBalanceMutation.mutate({
        userId: selectedUser.id,
        balance: data,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Urlaubskontingente verwalten</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>Fehler beim Laden</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid="text-admin-balance-error">
            Die Urlaubskontingente konnten nicht geladen werden.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Urlaubskontingente verwalten</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keine Teammitglieder gefunden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-admin-balance-management">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Urlaubskontingente verwalten</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const displayName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email || 'Unbenannter Benutzer';
            
            const isLowBalance = user.remainingDays <= 5;
            const isOverUsed = user.remainingDays < 0;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={`row-user-balance-${user.id}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium" data-testid={`text-user-name-${user.id}`}>
                      {displayName}
                    </span>
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span data-testid={`text-user-balance-${user.id}`}>
                      {user.usedDays}/{user.annualAllowance} Tage verwendet • 
                      <span className={`ml-1 ${
                        isOverUsed 
                          ? 'text-red-600 dark:text-red-400 font-medium' 
                          : isLowBalance
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {user.remainingDays} verbleibend
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {isOverUsed && (
                    <Badge variant="destructive" className="text-xs" data-testid={`badge-over-used-${user.id}`}>
                      Überzogen
                    </Badge>
                  )}
                  {isLowBalance && !isOverUsed && (
                    <Badge variant="outline" className="text-xs border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400">
                      Niedrig
                    </Badge>
                  )}
                  
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBalance(user)}
                        data-testid={`button-edit-balance-${user.id}`}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    </DialogTrigger>
                    {selectedUser?.id === user.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Urlaubskontingent für {displayName} bearbeiten
                          </DialogTitle>
                        </DialogHeader>
                        
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="annualAllowance"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Jährliches Urlaubskontingent (Tage)</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      min="0"
                                      max="365"
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      data-testid="input-annual-allowance"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Verwendete Tage:</span>
                                <span className="font-medium">{selectedUser.usedDays}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Aktuelles Kontingent:</span>
                                <span className="font-medium">{selectedUser.annualAllowance}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span>Neues verbleibendes Saldo:</span>
                                <span className={`font-medium ${
                                  (form.watch('annualAllowance') - selectedUser.usedDays) < 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {form.watch('annualAllowance') - selectedUser.usedDays}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsEditDialogOpen(false);
                                  setSelectedUser(null);
                                  form.reset();
                                }}
                                disabled={updateBalanceMutation.isPending}
                              >
                                Abbrechen
                              </Button>
                              <Button
                                type="submit"
                                disabled={updateBalanceMutation.isPending}
                                data-testid="button-save-balance"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                {updateBalanceMutation.isPending ? 'Speichert...' : 'Speichern'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}