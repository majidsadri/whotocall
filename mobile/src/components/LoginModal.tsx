import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { migrateContacts } from '../services/api';
import { colors } from '../styles/colors';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const { signInWithLinkedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkedInLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signInWithLinkedIn();

      if (!result?.url) {
        throw new Error('No OAuth URL returned');
      }

      // Open in-app browser for OAuth
      if (await InAppBrowser.isAvailable()) {
        const authResult = await InAppBrowser.openAuth(result.url, 'reachr://auth/callback', {
          // iOS options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: colors.canvas,
          preferredControlTintColor: colors.accent,
          // Android options
          showTitle: true,
          toolbarColor: colors.canvas,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });

        console.log('Auth result:', authResult);

        if (authResult.type === 'success' && authResult.url) {
          // Handle the callback URL directly
          const url = authResult.url;
          console.log('Callback URL:', url);

          // Extract tokens from URL
          const hashPart = url.split('#')[1];
          const queryPart = url.split('?')[1]?.split('#')[0];
          const params = new URLSearchParams(hashPart || queryPart || '');

          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const code = params.get('code');

          if (accessToken && refreshToken) {
            // Implicit flow - set session directly
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }
            console.log('Session set:', data.user?.email);

            // Migrate existing contacts to this user's account
            try {
              const migrationResult = await migrateContacts();
              console.log('Migration result:', migrationResult);
            } catch (migrationError) {
              console.log('Migration skipped or failed:', migrationError);
            }

            onClose();
          } else if (code) {
            // PKCE flow - exchange code for session
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              throw exchangeError;
            }
            console.log('Code exchanged:', data.user?.email);

            // Migrate existing contacts to this user's account
            try {
              const migrationResult = await migrateContacts();
              console.log('Migration result:', migrationResult);
            } catch (migrationError) {
              console.log('Migration skipped or failed:', migrationError);
            }

            onClose();
          } else {
            console.log('No tokens or code in URL');
            // Check if there's an error
            const errorParam = params.get('error');
            const errorDesc = params.get('error_description');
            if (errorParam) {
              throw new Error(errorDesc || errorParam);
            }
          }
        } else if (authResult.type === 'cancel') {
          console.log('User cancelled login');
        }
      } else {
        // Fallback to system browser
        Linking.openURL(result.url);
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>
              Connect your account to sync contacts across devices
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkedinButton}
            onPress={handleLinkedInLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Icon name="linkedin" size={22} color={colors.white} />
                <Text style={styles.linkedinButtonText}>Continue with LinkedIn</Text>
              </>
            )}
          </TouchableOpacity>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.optionalNote}>
            Signing in is optional. You can use Reachr without an account.
          </Text>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.misty,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: colors.misty,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.smoke,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkedinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A66C2',
    paddingVertical: 14,
    borderRadius: 9999,
    gap: 12,
    marginBottom: 16,
  },
  linkedinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  errorContainer: {
    backgroundColor: colors.muted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  optionalNote: {
    fontSize: 13,
    color: colors.smoke,
    textAlign: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.smoke,
    fontWeight: '500',
  },
});
