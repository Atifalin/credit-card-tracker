import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase';
import CustomButton from '../components/CustomButton';
import Toast from 'react-native-toast-message';

interface Profile {
  id: string;
  name: string;
  email: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile({ ...data, email: user.email! });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await signOut();
      if (error) throw error;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error signing out',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    Alert.alert('Coming Soon', 'Data export feature will be available soon!');
  };

  const handleBackupData = () => {
    Alert.alert('Coming Soon', 'Data backup feature will be available soon!');
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: handleSignOut,
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: 'https://ui-avatars.com/api/?name=' + (profile?.name || 'User') }}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.name}>{profile?.name || 'User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="bell-outline" size={24} color={COLORS.gray700} />
            <Text style={styles.settingText}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="fingerprint" size={24} color={COLORS.gray700} />
            <Text style={styles.settingText}>Biometric Authentication</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
          <View style={styles.menuLeft}>
            <Icon name="export" size={24} color={COLORS.gray700} />
            <Text style={styles.menuText}>Export Data</Text>
          </View>
          <Icon name="chevron-right" size={24} color={COLORS.gray400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleBackupData}>
          <View style={styles.menuLeft}>
            <Icon name="cloud-upload" size={24} color={COLORS.gray700} />
            <Text style={styles.menuText}>Backup Data</Text>
          </View>
          <Icon name="chevron-right" size={24} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <CustomButton
          title="Sign Out"
          onPress={confirmSignOut}
          variant="outline"
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SIZES.xl * 1.5,
    paddingHorizontal: SIZES.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    marginBottom: SIZES.lg,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  name: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.gray800,
    marginBottom: SIZES.xs,
  },
  email: {
    fontSize: SIZES.md,
    color: COLORS.gray500,
  },
  section: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: SIZES.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  settingText: {
    fontSize: SIZES.md,
    color: COLORS.gray700,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  menuText: {
    fontSize: SIZES.md,
    color: COLORS.gray700,
  },
});
