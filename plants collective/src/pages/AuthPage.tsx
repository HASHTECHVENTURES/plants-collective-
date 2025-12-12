import { useState } from "react";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getCountries, getStatesByCountry, getCitiesByState } from "@/lib/locationData";

const AuthPage = () => {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Get location data
  const countries = getCountries();
  const states = country ? getStatesByCountry(country) : [];
  const cities = country && state ? getCitiesByState(country, state) : [];

  // Handle country change
  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setState(""); // Reset state when country changes
    setCity(""); // Reset city when country changes
  };

  // Handle state change
  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    setCity(""); // Reset city when state changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate PIN - must be 4 digits
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN (numbers only)",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validate phone number - required for both login and signup
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && !name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && !email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }


    if (isSignUp && !gender.trim()) {
      toast({
        title: "Gender Required",
        description: "Please select your gender for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && !birthdate.trim()) {
      toast({
        title: "Birthdate Required",
        description: "Please enter your birthdate for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && !country.trim()) {
      toast({
        title: "Country Required",
        description: "Please select your country for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && !state.trim()) {
      toast({
        title: "State Required",
        description: "Please select your state for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp && !city.trim()) {
      toast({
        title: "City Required",
        description: "Please select your city for sign up",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const result = await login(
        pin,
        phoneNumber.trim(),
        isSignUp ? name.trim() : undefined,
        isSignUp ? email.trim() : undefined,
        isSignUp ? gender.trim() : undefined,
        isSignUp ? birthdate.trim() : undefined,
        isSignUp ? country.trim() : undefined,
        isSignUp ? state.trim() : undefined,
        isSignUp ? city.trim() : undefined
      );

      if (result.success) {
        toast({
          title: isSignUp ? "Account Created!" : "Welcome Back!",
          description: "Your personalized skincare journey begins now"
        });
      } else {
        toast({
          title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
          description: result.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center p-4 safe-area-all">
      {/* Main Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white border-2 border-green-200 rounded-xl flex items-center justify-center p-2 mb-2">
            <img 
              src="https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/Icon.png" 
              alt="Plants Collective Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-semibold text-green-800">Plants Collective</h2>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-gray-600 text-sm">
            {isSignUp ? "Sign up for your Plants Collective account" : "Sign in to your Plants Collective account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500"
              />
            </div>
          )}

          {/* Email Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500"
              />
            </div>
          )}

          {/* Gender Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 px-3"
              >
                <option key="gender-empty" value="">Select your gender</option>
                <option key="Male" value="Male">Male</option>
                <option key="Female" value="Female">Female</option>
                <option key="Other" value="Other">Other</option>
                <option key="Prefer not to say" value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          )}

          {/* Birthdate Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Birthdate *
              </label>
              <Input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500"
              />
            </div>
          )}

          {/* Country Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Country *
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 px-3"
              >
                <option key="country-empty" value="">Select your country</option>
                {countries.map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.name}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* State Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={!country}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option key="state-empty" value="">{country ? "Select your state" : "Select country first"}</option>
                {states.map((stateOption) => (
                  <option key={stateOption.code} value={stateOption.name}>
                    {stateOption.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* City Input - Only for Sign Up */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                City *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!state}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option key="city-empty" value="">{state ? "Select your city" : "Select state first"}</option>
                {cities.map((cityOption) => (
                  <option key={cityOption.id} value={cityOption.name}>
                    {cityOption.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phone Number - Required for both Login and Sign Up */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Phone Number *
            </label>
            <Input
              type="tel"
              placeholder="1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* PIN Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              4-Digit PIN *
            </label>
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                placeholder="1234"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg text-center text-lg tracking-widest focus:border-green-500 focus:ring-green-500"
                maxLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PIN must be exactly 4 digits (numbers only). This will be your secure login method.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </div>
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </Button>
        </form>

        {/* Toggle Sign Up/Sign In */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-green-600 hover:text-green-700 text-sm"
          >
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <span className="font-medium">{isSignUp ? "Sign in" : "Sign up"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;