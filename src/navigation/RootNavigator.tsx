import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import CardDetailsScreen from '../screens/CardDetailsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import AddCardScreen from '../screens/AddCardScreen';
import EditCardScreen from '../screens/EditCardScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create a context for profile state
export const ProfileContext = React.createContext<{
  hasProfile: boolean | null;
  refreshProfile: () => Promise<void>;
}>({
  hasProfile: null,
  refreshProfile: async () => {},
});

export default function RootNavigator() {
  const { session, loading } = useAuth();
  const [hasProfile, setHasProfile] = React.useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = React.useState(true);

  const checkProfile = React.useCallback(async () => {
    if (session?.user) {
      setIsCheckingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error checking profile:', error);
          setHasProfile(false);
        } else {
          setHasProfile(!!data);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    } else {
      setHasProfile(null);
      setIsCheckingProfile(false);
    }
  }, [session]);

  // Check profile on mount and when session changes
  React.useEffect(() => {
    checkProfile();
  }, [checkProfile]);

  if (loading || isCheckingProfile) {
    return <LoadingScreen />;
  }

  return (
    <ProfileContext.Provider value={{ hasProfile, refreshProfile: checkProfile }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!session ? (
            // Public routes
            <Stack.Group>
              <Stack.Screen 
                name="Auth" 
                component={AuthScreen} 
                options={{
                  animation: 'fade',
                }}
              />
            </Stack.Group>
          ) : !hasProfile ? (
            // Onboarding route
            <Stack.Group>
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingScreen}
                options={{
                  animation: 'slide_from_right',
                  gestureEnabled: false,
                }}
              />
            </Stack.Group>
          ) : (
            // Protected routes
            <Stack.Group>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen 
                name="AddCard" 
                component={AddCardScreen}
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="EditCard" 
                component={EditCardScreen}
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="CardDetails" 
                component={CardDetailsScreen}
                options={{
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen 
                name="AddTransaction" 
                component={AddTransactionScreen}
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="EditTransaction" 
                component={EditTransactionScreen}
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="TransactionDetails" 
                component={TransactionDetailsScreen}
                options={{
                  animation: 'slide_from_right',
                }}
              />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ProfileContext.Provider>
  );
}
