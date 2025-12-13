import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, ArrowLeft, Lock, Mail, Phone, Calendar, MapPin, Users, Camera, Loader2 } from "lucide-react";
import { getCountries, getStatesByCountry, getCitiesByState } from "@/lib/locationData";
import { supabase } from "@/lib/supabase";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [birthdate, setBirthdate] = useState(user?.birthdate || "");
  const [country, setCountry] = useState(user?.country || "");
  const [state, setState] = useState(user?.state || "");
  const [city, setCity] = useState(user?.city || "");
  const [pin, setPin] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // Location data
  const [countries, setCountries] = useState<Array<{ name: string; code: string }>>([]);
  const [states, setStates] = useState<Array<{ name: string; code: string }>>([]);
  const [cities, setCities] = useState<Array<{ name: string; id: string }>>([]);

  // Load countries on mount
  useEffect(() => {
    const countriesList = getCountries();
    setCountries(countriesList);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (country) {
      const statesList = getStatesByCountry(country);
      setStates(statesList);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [country]);

  // Load cities when state changes
  useEffect(() => {
    if (state && country) {
      const citiesList = getCitiesByState(country, state);
      setCities(citiesList);
    } else {
      setCities([]);
    }
  }, [state, country]);

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phone_number || "");
      setGender(user.gender || "");
      setBirthdate(user.birthdate || "");
      setCountry(user.country || "");
      setState(user.state || "");
      setCity(user.city || "");
      setProfilePhoto(user.profile_photo || "");
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, use base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setProfilePhoto(base64);
          toast({
            title: "Photo Updated",
            description: "Click Save to apply changes"
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        setProfilePhoto(publicUrl);
        toast({
          title: "Photo Uploaded",
          description: "Click Save to apply changes"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Invalid Input",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    if (pin.length > 0 && pin.length !== 4) {
      toast({
        title: "Invalid Input",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    // Email validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ 
        name: name.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        birthdate: birthdate || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        profile_photo: profilePhoto || undefined,
        ...(pin.length === 4 && { pin })
      });
      setPin("");
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-plants-cream via-background to-plants-light-gold">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">Edit Profile</h1>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 gesture-safe-bottom max-w-md mx-auto">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-green-400 to-blue-500">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Tap camera to change photo</p>
        </div>

        {/* Profile Form */}
        <Card className="shadow-lg border-0">
          <CardContent className="pt-6 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Phone Number (Read-only) */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={phoneNumber}
                  disabled
                  className="w-full pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Gender</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Birthdate */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full pl-10"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-sm font-medium block text-gray-700">Location</label>
              
              {/* Country */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setState("");
                    setCity("");
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              {states.length > 0 && (
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setCity("");
                    }}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* City */}
              {cities.length > 0 && (
                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Change PIN */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Change PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(value);
                  }}
                  placeholder="Enter new 4-digit PIN"
                  maxLength={4}
                  className="text-center tracking-widest pl-10"
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty to keep current PIN</p>
            </div>
            
            {/* Save Button */}
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 h-12 text-base font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
