import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { apiRequest } from "@/lib/queryClient";
import { insertVacationRequestSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Info, AlertTriangle, CheckCircle, Calendar, FileText, Send } from "lucide-react";

interface VacationBalance {
  annualAllowance: number;
  usedDays: number;
  remainingDays: number;
}

const formSchema = insertVacationRequestSchema
  .omit({ userId: true })
  .extend({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional(), // Make reason optional
  }).refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

interface AnimatedVacationFormProps {
  open: boolean;
  onClose: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 }
  }
};

const stepVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    }
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const fieldVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    }
  }
};

export default function AnimatedVacationForm({ open, onClose }: AnimatedVacationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<VacationBalance>({
    queryKey: ['/api/users/balance'],
    enabled: open,
  });

  // Reset dialog state when opening
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setCurrentStep(0);
    }
  }, [open]);

  const requestedDays = useMemo(() => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  }, [form.watch("startDate"), form.watch("endDate")]);

  const wouldExceedBalance = balance ? (requestedDays > balance.remainingDays) : false;
  const balanceAfterRequest = balance ? (balance.remainingDays - requestedDays) : 0;

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/vacation-requests', data);
      return await response.json();
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
      
      // Show success step instead of closing immediately
      setSubmitted(true);
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
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.code === "INSUFFICIENT_BALANCE") {
          toast({
            title: "Ungenügender Urlaubssaldo",
            description: errorData.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Fehler beim Erstellen",
        description: "Der Urlaubsantrag konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRequestMutation.mutate(values);
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return form.watch("startDate") && form.watch("endDate") && !wouldExceedBalance;
    }
    if (currentStep === 1) {
      // Reason is optional, always allow proceeding to confirmation
      return true;
    }
    return true;
  };

  const steps = [
    {
      title: "Zeitraum wählen",
      description: "Wählen Sie Start- und Enddatum",
      icon: Calendar,
    },
    {
      title: "Begründung angeben",
      description: "Geben Sie einen Grund für den Urlaub an",
      icon: FileText,
    },
    {
      title: "Bestätigung",
      description: "Überprüfen Sie Ihre Angaben",
      icon: CheckCircle,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md glass-card">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader className="pb-6">
                <motion.div 
                  className="flex items-center gap-3 mb-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Calendar className="h-6 w-6 text-primary" />
                  </motion.div>
                  <DialogTitle className="gradient-text">Urlaubsantrag stellen</DialogTitle>
                </motion.div>
                
                {/* Progress Indicator */}
                <motion.div 
                  className="flex justify-between items-center mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={index}
                        className="flex flex-col items-center flex-1"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            index <= currentStep 
                              ? 'border-primary bg-primary text-primary-foreground' 
                              : 'border-muted-foreground bg-background text-muted-foreground'
                          }`}
                          animate={{
                            scale: index === currentStep ? 1.1 : 1,
                            boxShadow: index === currentStep ? 'var(--shadow-glow)' : 'none'
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </motion.div>
                        <div className="mt-2 text-xs text-center">
                          <div className={index <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'}>
                            {step.title}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
                
                {/* Progress Bar */}
                <motion.div 
                  className="w-full bg-secondary h-1 rounded-full mb-4"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </motion.div>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {/* Step 0: Date Selection */}
                    {currentStep === 0 && (
                      <motion.div
                        key="step0"
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-4"
                      >
                        <motion.div variants={fieldVariants} className="form-field">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Startdatum
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    data-testid="input-start-date"
                                    className="transition-all duration-200 dark:bg-slate-700 dark:text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div variants={fieldVariants} className="form-field">
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Enddatum
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    data-testid="input-end-date"
                                    className="transition-all duration-200 dark:bg-slate-700 dark:text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        {requestedDays > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Alert className={wouldExceedBalance ? "border-destructive" : "border-primary"}>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                <div className="space-y-2">
                                  <div>Beantragte Tage: <strong>{requestedDays}</strong></div>
                                  {balance && (
                                    <>
                                      <div>Verfügbare Tage: <strong>{balance.remainingDays}</strong></div>
                                      {!wouldExceedBalance && (
                                        <div className="text-sm text-muted-foreground">
                                          Verbleibend nach Antrag: {balanceAfterRequest} Tage
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 1: Reason */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <motion.div variants={fieldVariants} className="form-field">
                          <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Begründung <span className="text-xs text-muted-foreground">(optional)</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Geben Sie einen Grund für Ihren Urlaub an..."
                                    className="resize-none transition-all duration-200"
                                    {...field}
                                    data-testid="textarea-reason"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Step 2: Confirmation */}
                    {currentStep === 2 && !submitted && (
                      <motion.div
                        key="step2"
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-4"
                      >
                        <Alert className="border-primary">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div><strong>Zeitraum:</strong> {form.watch("startDate")} bis {form.watch("endDate")}</div>
                              <div><strong>Tage:</strong> {requestedDays}</div>
                              <div><strong>Begründung:</strong> {form.watch("reason") || "Keine Begründung angegeben"}</div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    {/* Success Step - shown after submission */}
                    {submitted && (
                      <motion.div
                        key="success"
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-4"
                      >
                        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                                ✅ Antrag erfolgreich erstellt!
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Ihr Urlaubsantrag wurde an Ihren Vorgesetzten weitergeleitet.
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  {!submitted && (
                    <motion.div 
                      className="flex justify-between pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className="button-secondary"
                        >
                          Zurück
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {currentStep < 2 ? (
                          <Button
                            type="button"
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="button-primary"
                          >
                            Weiter
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            disabled={createRequestMutation.isPending}
                            className="button-primary"
                            data-testid="button-submit"
                          >
                            {createRequestMutation.isPending ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mr-2"
                              >
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              </motion.div>
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Antrag stellen
                          </Button>
                        )}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Close Button - shown after successful submission */}
                  {submitted && (
                    <motion.div 
                      className="flex justify-center pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          onClick={() => {
                            form.reset();
                            setCurrentStep(0);
                            setSubmitted(false);
                            onClose();
                          }}
                          className="button-primary"
                          data-testid="button-close"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Fertig
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </form>
              </Form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}