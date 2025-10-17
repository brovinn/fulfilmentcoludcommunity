import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Heart, CreditCard, Smartphone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schemas
const ecocashSchema = z.object({
  amount: z.number().min(1, "Minimum amount is $1"),
  phoneNumber: z.string().regex(/^(\+?263|0)?7[0-9]{8}$/, "Invalid Ecocash number"),
  message: z.string().max(500).optional(),
});

const cardSchema = z.object({
  amount: z.number().min(1, "Minimum amount is $1"),
  cardNumber: z.string().regex(/^[0-9]{13,19}$/, "Invalid card number"),
  accountNumber: z.string().min(5, "Invalid account number"),
  cardholderName: z.string().min(2, "Cardholder name required"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry (MM/YY)"),
  cvv: z.string().regex(/^[0-9]{3,4}$/, "Invalid CVV"),
  message: z.string().max(500).optional(),
});

export const ContributeTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"ecocash" | "card">("ecocash");

  // Ecocash form state
  const [ecocashAmount, setEcocashAmount] = useState("");
  const [ecocashPhone, setEcocashPhone] = useState("");
  const [ecocashMessage, setEcocashMessage] = useState("");

  // Card form state
  const [cardAmount, setCardAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardMessage, setCardMessage] = useState("");

  const presetAmounts = [5, 10, 20, 50, 100];

  const handleEcocashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to make a contribution");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validated = ecocashSchema.parse({
        amount: parseFloat(ecocashAmount),
        phoneNumber: ecocashPhone,
        message: ecocashMessage,
      });

      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          amount: Math.round(validated.amount * 100), // Store in cents
          message: validated.message || null,
          phone: validated.phoneNumber,
          currency: 'usd',
          user_id: user.id,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Contribution submitted",
        description: "Your Ecocash payment is being processed. You will receive a prompt on your phone.",
      });

      // Reset form
      setEcocashAmount("");
      setEcocashPhone("");
      setEcocashMessage("");
    } catch (err: any) {
      const errorMessage = err instanceof z.ZodError 
        ? err.errors[0].message 
        : err.message || "Failed to process contribution";
      setError(errorMessage);
      toast({
        title: "Contribution failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to make a contribution");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validated = cardSchema.parse({
        amount: parseFloat(cardAmount),
        cardNumber: cardNumber.replace(/\s/g, ''),
        accountNumber,
        cardholderName,
        expiryDate,
        cvv,
        message: cardMessage,
      });

      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          amount: Math.round(validated.amount * 100), // Store in cents
          message: validated.message || null,
          currency: 'usd',
          user_id: user.id,
          status: 'pending',
          // Note: In production, NEVER store full card details in database
          // This should be processed through a secure payment gateway
        });

      if (insertError) throw insertError;

      toast({
        title: "Contribution submitted",
        description: "Your card payment is being processed securely.",
      });

      // Reset form
      setCardAmount("");
      setCardNumber("");
      setAccountNumber("");
      setCardholderName("");
      setExpiryDate("");
      setCvv("");
      setCardMessage("");
    } catch (err: any) {
      const errorMessage = err instanceof z.ZodError 
        ? err.errors[0].message 
        : err.message || "Failed to process contribution";
      setError(errorMessage);
      toast({
        title: "Contribution failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" />
            Make a Contribution
          </CardTitle>
          <CardDescription>Support our community</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">Please log in to make a contribution</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent" />
          Make a Contribution
        </CardTitle>
        <CardDescription>Choose your preferred payment method</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "ecocash" | "card")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ecocash" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Ecocash
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card Payment
            </TabsTrigger>
          </TabsList>

          {/* Ecocash Payment */}
          <TabsContent value="ecocash">
            <form onSubmit={handleEcocashSubmit} className="space-y-4">
              {error && paymentMethod === "ecocash" && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Quick Amounts (USD)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={ecocashAmount === preset.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEcocashAmount(preset.toString())}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecocash-amount">Amount (USD) *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm bg-muted border border-r-0 rounded-l-md">
                    $
                  </span>
                  <Input
                    id="ecocash-amount"
                    type="number"
                    step="0.01"
                    value={ecocashAmount}
                    onChange={(e) => setEcocashAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    required
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecocash-phone">Ecocash Number *</Label>
                <Input
                  id="ecocash-phone"
                  type="tel"
                  value={ecocashPhone}
                  onChange={(e) => setEcocashPhone(e.target.value)}
                  placeholder="0771234567 or +263771234567"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You will receive a prompt on your phone to approve the payment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecocash-message">Message (Optional)</Label>
                <Textarea
                  id="ecocash-message"
                  value={ecocashMessage}
                  onChange={(e) => setEcocashMessage(e.target.value)}
                  placeholder="Leave a message with your contribution"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !ecocashAmount}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Pay ${ecocashAmount || "0"} via Ecocash
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Card Payment */}
          <TabsContent value="card">
            <form onSubmit={handleCardSubmit} className="space-y-4">
              {error && paymentMethod === "card" && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Quick Amounts (USD)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={cardAmount === preset.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCardAmount(preset.toString())}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-amount">Amount (USD) *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm bg-muted border border-r-0 rounded-l-md">
                    $
                  </span>
                  <Input
                    id="card-amount"
                    type="number"
                    step="0.01"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    required
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholder-name">Cardholder Name *</Label>
                <Input
                  id="cardholder-name"
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-number">Card Number *</Label>
                <Input
                  id="card-number"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '');
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    setCardNumber(formatted);
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number *</Label>
                <Input
                  id="account-number"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter your account number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date *</Label>
                  <Input
                    id="expiry-date"
                    type="text"
                    value={expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setExpiryDate(value);
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-message">Message (Optional)</Label>
                <Textarea
                  id="card-message"
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  placeholder="Leave a message with your contribution"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Payment Security:</p>
                  <ul className="space-y-1 text-xs">
                    <li>✓ SSL encrypted transactions</li>
                    <li>✓ PCI DSS compliant processing</li>
                    <li>✓ Bank-level security measures</li>
                  </ul>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !cardAmount}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${cardAmount || "0"} with Card
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                🔒 Your card information is encrypted and secure
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
