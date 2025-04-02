import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Function to check if a user needs to complete onboarding
  const checkOnboardingStatus = async (userId) => {
    try {
      // Check if the user needs to complete onboarding
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding')
        .eq('user_id', userId)
        .single();
      
      // Show onboarding if profile doesn't exist or hasn't completed onboarding
      if (error || !data || !data.has_completed_onboarding) {
        console.log('User needs to complete onboarding:', userId);
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
    }
  };

  useEffect(() => {
    // Check current session and subscribe to auth changes
    const checkSession = async () => {
      try {
        // Get the initial session
        const currentUser = await getCurrentUser();
        setUser(currentUser || null);
        
        if (currentUser) {
          // Check onboarding status for current user
          await checkOnboardingStatus(currentUser.id);
        }
        
        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user);
              
              // Check onboarding status for new sign-in
              await checkOnboardingStatus(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setShowOnboarding(false);
            }
          }
        );

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const value = {
    user,
    loading,
    showOnboarding,
    setShowOnboarding,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 