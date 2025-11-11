import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertVacationRequestSchema, type Organization } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";

interface VacationBalance {
  annualAllowance: number;
  usedDays: number;
  remainingDays: number;
}

// Create form schema without userId (server populates from session)
const formSchema = insertVacationRequestSchema
  .omit({ userId: true })
  .extend({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  }).refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

interface VacationRequestFormProps {
  open: boolean;
  onClose: () => void;
}

export default function VacationRequestForm({ open, onClose }: VacationRequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  // Reset form when dialog closes
  const handleClose = () => {
    form.reset();
    setCurrentStep(1);
    onClose();
  };

  // Fetch organization data
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', user?.organizationId],
    enabled: open && !!user?.organizationId,
  });

  // Calculate if tracking is enabled
  const trackingEnabled = organization?.vacationTrackingEnabled && user?.vacationTrackingEnabled;

  // Fetch user's vacation balance
  const { data: balance, isLoading: balanceLoading } = useQuery<VacationBalance>({
    queryKey: ['/api/users/balance'],
    enabled: open && trackingEnabled, // Only fetch when dialog is open and tracking is enabled
  });

  // Watch form values for reactive calculation
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  
  // Calculate business days using backend API
  const { data: businessDaysData, isLoading: isCalculating } = useQuery({
    queryKey: ['/api/calculate-business-days', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return { businessDays: 0 };
      
      const response = await apiRequest('POST', '/api/calculate-business-days', {
        startDate,
        endDate
      });
      return await response.json();
    },
    enabled: !!(startDate && endDate), // Only fetch when both dates are set
    staleTime: 1000 * 60, // Cache for 1 minute
  });
  
  const requestedDays = businessDaysData?.businessDays || 0;

  // Check if request would exceed balance
  const wouldExceedBalance = trackingEnabled && balance ? (requestedDays > balance.remainingDays) : false;
  const balanceAfterRequest = balance ? (balance.remainingDays - requestedDays) : 0;

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/vacation-requests', data);
      return await response.json(); // Properly parse JSON response
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/balance'] });
      
      toast({
        title: "Antrag erstellt",
        description: result.conflicts?.length > 0 
          ? `Ihr Antrag wurde erstellt, aber es gibt ${result.conflicts.length} Konflikt(e) mit anderen Anträgen.`
          : "Ihr Urlaubsantrag wurde erfolgreich erstellt.",
        variant: result.conflicts?.length > 0 ? "destructive" : "default",
      });
      
      handleClose();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Handle server-side balance validation errors
      if (error.status === 400 && error.message) {
        toast({
          title: "Urlaubsantrag abgelehnt",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Fehler",
        description: "Antrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate date fields before proceeding
      const startDate = form.getValues("startDate");
      const endDate = form.getValues("endDate");
      
      if (!startDate || !endDate) {
        toast({
          title: "Fehlende Daten",
          description: "Bitte wählen Sie Start- und Enddatum aus.",
          variant: "destructive",
        });
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        toast({
          title: "Ungültiger Zeitraum",
          description: "Das Startdatum muss vor dem Enddatum liegen.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Prevent submission if would exceed balance
    if (wouldExceedBalance && balance) {
      toast({
        title: "Urlaubssaldo überschritten",
        description: `Dieser Antrag würde Ihr Urlaubssaldo um ${Math.abs(balanceAfterRequest)} Tage überschreiten. Antrag kann nicht erstellt werden.`,
        variant: "destructive",
      });
      return; // Block submission
    }
    
    createRequestMutation.mutate(data);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Zeitraum wählen";
      case 2: return "Begründung angeben";
      case 3: return "Bestätigung";
      default: return "Zeitraum wählen";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-vacation-request">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Date Selection */}
            {currentStep === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startdatum</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enddatum</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show business days calculation or error */}
                {(startDate && endDate) && (
                  <>
                    {businessDaysData?.error ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {businessDaysData.error}
                        </AlertDescription>
                      </Alert>
                    ) : requestedDays === 0 && !isCalculating ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Der gewählte Zeitraum enthält keine Arbeitstage (nur Wochenenden und/oder Feiertage).
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-950/50 dark:border-blue-800">
                        {isCalculating ? (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Berechne Arbeitstage...
                          </p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Arbeitstage: {requestedDays} {requestedDays === 1 ? 'Tag' : 'Tage'}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              (Wochenenden und Feiertage ausgenommen)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Step 2: Reason */}
            {currentStep === 2 && (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Begründung (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="z.B. Jahresurlaub, Hochzeit, etc."
                        {...field}
                        value={field.value || ''} 
                        data-testid="textarea-reason"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 dark:bg-gray-900/50 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Zusammenfassung</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Zeitraum:</span>
                      <span className="font-medium">{startDate} bis {endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Arbeitstage:</span>
                      <span className="font-medium">{requestedDays} {requestedDays === 1 ? 'Tag' : 'Tage'}</span>
                    </div>
                    {form.getValues("reason") && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Begründung:</span>
                        <span className="font-medium max-w-48 text-right">{form.getValues("reason")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Balance Information */}
                {trackingEnabled && balance && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-950/50 dark:border-blue-800">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">Ihr Urlaubssaldo</p>
                          <p className="text-blue-700 dark:text-blue-300">
                            {balance.remainingDays} von {balance.annualAllowance} Tagen verfügbar
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {/* Request Impact */}
                    <div className={`border rounded-md p-3 ${
                      wouldExceedBalance 
                        ? "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800"
                        : "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800"
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <p className={`font-medium ${
                            wouldExceedBalance 
                              ? "text-red-900 dark:text-red-100" 
                              : "text-green-900 dark:text-green-100"
                          }`}>
                            Nach diesem Antrag
                          </p>
                          <p className={`${
                            wouldExceedBalance 
                              ? "text-red-700 dark:text-red-300" 
                              : "text-green-700 dark:text-green-300"
                          }`}>
                            Verbleibendes Saldo: {balanceAfterRequest} {Math.abs(balanceAfterRequest) === 1 ? 'Tag' : 'Tage'}
                          </p>
                        </div>
                        {wouldExceedBalance ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>

                    {/* Over-booking Warning */}
                    {wouldExceedBalance && (
                      <Alert variant="destructive" data-testid="alert-balance-exceeded">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Warnung:</strong> Dieser Antrag würde Ihr verfügbares Urlaubssaldo um {Math.abs(balanceAfterRequest)} {Math.abs(balanceAfterRequest) === 1 ? 'Tag' : 'Tage'} überschreiten.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 dark:bg-amber-950/50 dark:border-amber-800">
                  <div className="flex">
                    <Info className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-700 dark:text-amber-300">
                        Ihr Antrag wird automatisch auf Konflikte mit anderen Teammitgliedern geprüft.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={currentStep === 1 ? handleClose : prevStep}
                data-testid={currentStep === 1 ? "button-cancel" : "button-back"}
              >
                {currentStep === 1 ? "Abbrechen" : "Zurück"}
              </Button>
              
              {currentStep < 3 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  data-testid="button-next"
                >
                  Weiter
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createRequestMutation.isPending || wouldExceedBalance || requestedDays === 0 || isCalculating}
                  data-testid="button-submit"
                >
                  {createRequestMutation.isPending 
                    ? "Wird erstellt..." 
                    : isCalculating
                      ? "Berechne..."
                    : requestedDays === 0
                      ? "Keine Arbeitstage"
                    : wouldExceedBalance 
                      ? "Unzureichendes Saldo"
                      : "Antrag stellen"
                  }
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
