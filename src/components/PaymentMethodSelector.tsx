import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Building, Wallet, ArrowLeft } from "lucide-react";
import InternationalDonationForm from "./InternationalDonationForm";
import { DonationForm } from "./DonationForm";

type PaymentMethod = 'card' | 'bank' | 'paypal' | null;

export const PaymentMethodSelector = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

  const paymentMethods = [
    {
      id: 'card' as const,
      title: 'Credit/Debit Card',
      description: 'Pay securely with your credit or debit card',
      icon: CreditCard,
      popular: true,
    },
    {
      id: 'bank' as const,
      title: 'Bank Transfer',
      description: 'Direct bank transfer for larger donations',
      icon: Building,
      popular: false,
    },
    {
      id: 'paypal' as const,
      title: 'PayPal / Digital Wallet',
      description: 'Quick payment with PayPal or other digital wallets',
      icon: Wallet,
      popular: false,
    },
  ];

  if (selectedMethod === 'card') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedMethod(null)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change Payment Method
        </Button>
        <InternationalDonationForm />
      </div>
    );
  }

  if (selectedMethod === 'bank') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedMethod(null)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change Payment Method
        </Button>
        <DonationForm />
      </div>
    );
  }

  if (selectedMethod === 'paypal') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedMethod(null)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change Payment Method
        </Button>
        <DonationForm />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Choose Payment Method</CardTitle>
        <CardDescription>
          Select your preferred payment method to continue with your donation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Button
                key={method.id}
                variant="outline"
                className="h-auto p-6 flex items-start gap-4 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{method.title}</h3>
                    {method.popular && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            🔒 All payment methods are secure and encrypted. Your financial information is protected with industry-standard security measures.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
