import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, GRADIENTS } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signInWithEmail, signUpWithEmail } from '../services/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Toast from 'react-native-toast-message';
import { supabase } from '../services/supabase';

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AuthScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return false;
    }
    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      } else {
        // For signup, we need to wait for the user to be created
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;

        if (data?.user) {
          Toast.show({
            type: 'success',
            text1: 'Account created',
            text2: 'Please wait while we set up your account...',
          });
          
          // Wait a bit for the user to be fully created in Supabase
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Sign in the user automatically
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) throw signInError;
        } else {
          Toast.show({
            type: 'info',
            text1: 'Check your email',
            text2: 'Please verify your email address to continue',
          });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.header}
          >
            <Icon name="credit-card-multiple" size={80} color={COLORS.white} />
            <Text style={styles.title}>Credit Card Manager</Text>
            <Text style={styles.subtitle}>Track your expenses with ease</Text>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <CustomButton
              title={isLogin ? 'Login' : 'Sign Up'}
              onPress={handleSubmit}
              loading={loading}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <CustomButton
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              variant="outline"
              style={styles.googleButton}
              disabled={loading}
            />

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.switchButton}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    borderBottomLeftRadius: SIZES.borderRadiusLg,
    borderBottomRightRadius: SIZES.borderRadiusLg,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: SIZES.md,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.white,
    marginTop: SIZES.xs,
  },
  form: {
    flex: 1,
    padding: SIZES.screenPadding,
  },
  formTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SIZES.xl,
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.borderRadiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    fontSize: SIZES.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray300,
  },
  dividerText: {
    color: COLORS.gray500,
    paddingHorizontal: SIZES.md,
  },
  googleButton: {
    marginBottom: SIZES.xl,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.primary,
    fontSize: SIZES.md,
  },
});
