import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Heart, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const DonationForm = () => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const presetAmounts = [25, 50, 100, 250];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const donationAmount = parseInt(amount);
      if (donationAmount < 1) {
        throw new Error("Minimum donation amount is $1");
      }

      // In a real implementation, you would integrate with a payment processor like Stripe
      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          amount: donationAmount * 100, // Store in cents
          message: message || null,
          donor_email: donorEmail || user.email,
          currency,
          user_id: user.id,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Donation submitted",
        description: "Thank you for your generous donation! Payment processing will be implemented soon.",
      });

      // Reset form
      setAmount("");
      setMessage("");
      setDonorEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to process donation");
      toast({
        title: "Donation failed",
        description: err.message || "Failed to process donation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent" />
          Make a Donation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="grid grid-cols-2 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm bg-muted border border-r-0 rounded-l-md">
                $
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                required
                className="rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD - US Dollar</SelectItem>
                <SelectItem value="eur">EUR - Euro</SelectItem>
                <SelectItem value="gbp">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder={user?.email || "Enter your email"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message with your donation"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-4">
              <p className="font-semibold mb-2">Payment Security:</p>
              <ul className="space-y-1">
                <li>• SSL encrypted transactions</li>
                <li>• PCI DSS compliant processing</li>
                <li>• Bank-level security measures</li>
              </ul>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !amount || parseInt(amount) < 1}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Donate ${amount || "0"}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This is a demonstration. Actual payment processing will be implemented with Stripe integration.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};