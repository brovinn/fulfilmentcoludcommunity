import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Shield, Globe } from "lucide-react";

interface DonationFormData {
  amount: string;
  currency: string;
  donor_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  message: string;
  anonymous: boolean;
  marketing_consent: boolean;
  terms_accepted: boolean;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
  'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Australia',
  'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Other'
];

const InternationalDonationForm = () => {
  const [formData, setFormData] = useState<DonationFormData>({
    amount: "",
    currency: "USD",
    donor_email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    message: "",
    anonymous: false,
    marketing_consent: false,
    terms_accepted: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.push("Please enter a valid donation amount");
    }
    
    if (!formData.donor_email || !/\S+@\S+\.\S+/.test(formData.donor_email)) {
      newErrors.push("Please enter a valid email address");
    }
    
    if (!formData.first_name.trim()) {
      newErrors.push("First name is required");
    }
    
    if (!formData.last_name.trim()) {
      newErrors.push("Last name is required");
    }
    
    if (!formData.country) {
      newErrors.push("Please select your country");
    }
    
    if (!formData.terms_accepted) {
      newErrors.push("You must accept the terms and conditions");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrors(["Please log in to make a donation"]);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const donationData = {
        amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
        currency: formData.currency.toLowerCase(),
        donor_email: formData.donor_email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        message: formData.message,
        anonymous: formData.anonymous,
        marketing_consent: formData.marketing_consent,
        user_id: user.id,
        status: 'pending'
      };

      const { error } = await supabase
        .from('donations')
        .insert([donationData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Thank you for your donation!",
        description: "Your contribution has been recorded. You will receive a confirmation email shortly.",
      });

      // Reset form
      setFormData({
        amount: "",
        currency: "USD",
        donor_email: "",
        first_name: "",
        last_name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        message: "",
        anonymous: false,
        marketing_consent: false,
        terms_accepted: false,
      });
      
    } catch (error) {
      console.error('Error submitting donation:', error);
      setErrors(['Failed to process donation. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof DonationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency);

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Support Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">Please log in to make a donation</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Secure International Donations</span>
            <Shield className="h-5 w-5 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Support Our Mission</CardTitle>
        <CardDescription>
          Your contribution helps us make a positive impact worldwide. All transactions are secure and compliant with international standards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Donation Amount & Currency */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Donation Amount</Label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    {selectedCurrency?.symbol}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-32">
                <Select value={formData.currency} onValueChange={(value) => updateField('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Personal Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="donor_email">Email Address *</Label>
              <Input
                id="donor_email"
                type="email"
                value={formData.donor_email}
                onChange={(e) => updateField('donor_email', e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Address Information</Label>
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Your city"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  placeholder="State or Province"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select value={formData.country} onValueChange={(value) => updateField('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Share why you're supporting our mission..."
              rows={3}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={formData.anonymous}
                onCheckedChange={(checked) => updateField('anonymous', !!checked)}
              />
              <Label htmlFor="anonymous" className="text-sm">
                Make this donation anonymous
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing_consent"
                checked={formData.marketing_consent}
                onCheckedChange={(checked) => updateField('marketing_consent', !!checked)}
              />
              <Label htmlFor="marketing_consent" className="text-sm">
                I would like to receive updates about your mission and impact
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms_accepted"
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => updateField('terms_accepted', !!checked)}
              />
              <Label htmlFor="terms_accepted" className="text-sm">
                I accept the terms and conditions and privacy policy *
              </Label>
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading || !formData.amount || !formData.terms_accepted}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Donation...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Donate {selectedCurrency?.symbol}{formData.amount || '0.00'} {formData.currency}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              🔒 Your donation is secure and encrypted. We comply with international financial regulations including PCI DSS, GDPR, and local data protection laws.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InternationalDonationForm;