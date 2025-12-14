import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, createContext, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { storage } from "@/lib/config";
import { realtimeSyncService } from "@/services/realtimeSyncService";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { User, LoginResult, AuthContextType } from "@/types";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { openExternalLink } from "@/lib/externalLinkHandler";

// Pages
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";
import AskPlantsCollectivePage from "./pages/AskPlantsCollectivePage";
import IngredientsPage from "./pages/services/IngredientsPage";
import KnowYourIngredientsPage from "./pages/services/KnowYourIngredientsPage";
import HelpFeedbackPage from "./pages/HelpFeedbackPage";
// Removed old Enhanced Skin Analysis pages
import ProgressTrackingPage from "./pages/ProgressTrackingPage";
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import NotFound from "./pages/NotFound";
import KnowYourSkinPage from "./pages/services/KnowYourSkinPage";
import EnhancedSkinAnalysisResultsPage from "./pages/EnhancedSkinAnalysisResultsPage";
import GoldMeetPage from "./pages/GoldMeetPage";
import NotificationsPage from "./pages/NotificationsPage";

const queryClient = new QueryClient();


const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Component to handle Android back button
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle back button on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = async () => {
      // Pages where back button should exit app (home or login)
      const exitPages = ['/', '/auth'];
      const currentPath = location.pathname;

      // Check if we're on a page that should exit
      if (exitPages.includes(currentPath)) {
        // Exit the app
        CapacitorApp.exitApp();
      } else {
        // Navigate back in the app
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          // If no history, go to home
          navigate('/');
        }
      }
    };

    // Listen for back button press
    const listener = CapacitorApp.addListener('backButton', handleBackButton);

    // Cleanup listener on unmount
    return () => {
      listener.then(plugin => plugin.remove());
    };
  }, [navigate, location.pathname]);

  return null;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session using safe storage wrapper
    const storedUser = storage.get('plants-collective-user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        // Invalid JSON, clear it
        storage.remove('plants-collective-user');
      }
    }
    setLoading(false);

    // Cleanup real-time subscriptions on app unmount
    return () => {
      realtimeSyncService.cleanup();
    };
  }, []);

  const login = async (pin: string, phone_number: string, name?: string, email?: string, gender?: string, birthdate?: string, country?: string, state?: string, city?: string): Promise<LoginResult> => {
    try {
      // PIN validation - must be 4 digits (numbers only)
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits (numbers only)' };
      }

      // Validate phone number is provided
      if (!phone_number) {
        return { success: false, error: 'Phone number is required' };
      }

      // If signup data is provided, check if phone number already exists
      if (name && email && gender && birthdate && country && state && city) {
        // Check if phone number already exists (for signup prevention)
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone_number', phone_number)
          .maybeSingle();

        if (checkError) {
          console.error('Supabase error:', checkError);
          return { success: false, error: 'Database connection error. Please try again.' };
        }

        // If phone number already exists, don't allow signup
        if (existingProfile) {
          return { success: false, error: 'An account with this phone number already exists. Please sign in instead.' };
        }

        // Generate a UUID for the new user (we'll create a custom auth entry or use profiles directly)
        // For now, we'll use a UUID v4 generator
        const userId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create new user account with phone number + PIN combination
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            pin: pin,
            full_name: name,
            email: email,
            gender: gender,
            birthdate: birthdate,
            country: country,
            state: state,
            city: city,
            phone_number: phone_number,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Signup error:', insertError);
          return { success: false, error: 'Failed to create account. Please try again.' };
        }

        // Create user object from new profile
        const userData: User = {
          id: newProfile.id,
          pin: newProfile.pin,
          name: newProfile.full_name?.split(' ')[0] || name.split(' ')[0],
          email: newProfile.email,
          phone_number: newProfile.phone_number,
          gender: newProfile.gender,
          birthdate: newProfile.birthdate,
          country: newProfile.country,
          state: newProfile.state,
          city: newProfile.city,
          avatar: newProfile.avatar_url || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
          profile_photo: newProfile.profile_photo
        };

        // Store user using safe storage wrapper
        storage.set('plants-collective-user', JSON.stringify(userData));
        setUser(userData);

        return { success: true };
      }

      // For login (no signup data), check if phone number + PIN combination exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phone_number)
        .eq('pin', pin)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: 'Database connection error. Please try again.' };
      }

      // If profile doesn't exist, return error
      if (!profile) {
        return { success: false, error: 'Invalid phone number or PIN. Please check your credentials and try again.' };
      }

      // Extract first name from full_name
      const firstName = profile.full_name ? profile.full_name.split(' ')[0] : "Skincare Enthusiast";
      
      // Create user object from Supabase data
      const userData: User = {
        id: profile.id,
        pin: profile.pin,
        name: firstName,
        email: profile.email,
        phone_number: profile.phone_number,
        gender: profile.gender,
        birthdate: profile.birthdate,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        avatar: profile.avatar_url || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
        profile_photo: profile.profile_photo
      };

      // Store user in localStorage
      storage.set('plants-collective-user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    storage.remove('plants-collective-user');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      console.warn('Cannot update profile: no user logged in');
      return;
    }

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          email: updates.email,
          gender: updates.gender,
          birthdate: updates.birthdate,
          country: updates.country,
          state: updates.state,
          city: updates.city,
          profile_photo: updates.profile_photo,
          ...(updates.pin && { pin: updates.pin })
        })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
      }

      // Update local state
      const updatedUser = { ...user, ...updates };
      storage.set('plants-collective-user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthContext.Provider value={{ user, login, signOut, updateProfile }}>
            <Toaster />
            <Sonner />
            <ThemeProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <BackButtonHandler />
                <Routes>
                  <Route path="/" element={user ? <HomePage /> : <AuthPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/profile" element={user ? <ProfilePage /> : <AuthPage />} />
                  <Route path="/community" element={user ? <CommunityPage /> : <AuthPage />} />
                  <Route path="/know-your-skin" element={<KnowYourSkinPage />} />
                  <Route path="/skin-analysis-results" element={user ? <EnhancedSkinAnalysisResultsPage /> : <AuthPage />} />
                  <Route path="/progress-tracking" element={user ? <ProgressTrackingPage /> : <AuthPage />} />
                  <Route path="/ask-plants-collective" element={user ? <AskPlantsCollectivePage /> : <AuthPage />} />
                  <Route path="/gold-meet" element={user ? <GoldMeetPage /> : <AuthPage />} />
                  <Route path="/know-your-ingredients" element={user ? <KnowYourIngredientsPage /> : <AuthPage />} />
                  <Route path="/ingredients" element={user ? <IngredientsPage /> : <AuthPage />} />
                  <Route path="/help" element={user ? <HelpFeedbackPage /> : <AuthPage />} />
                  <Route path="/blogs" element={user ? <BlogsPage /> : <AuthPage />} />
                  <Route path="/blog/:id" element={user ? <BlogDetailPage /> : <AuthPage />} />
                  <Route path="/notifications" element={user ? <NotificationsPage /> : <AuthPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ThemeProvider>
          </AuthContext.Provider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;