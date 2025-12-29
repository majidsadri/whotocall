import { Linking, Alert } from 'react-native';
import { supabase } from './supabase';

export function setupDeepLinkHandler() {
  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('Initial deep link URL:', url);
      handleDeepLink(url);
    }
  });

  // Handle URLs while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('Deep link URL received:', url);
    handleDeepLink(url);
  });

  return () => subscription.remove();
}

async function handleDeepLink(url: string) {
  console.log('=== Deep Link Handler ===');
  console.log('Full URL:', url);

  if (url.startsWith('reachr://auth/callback') || url.includes('auth/callback')) {
    try {
      // Extract tokens from URL hash or query params
      const hashPart = url.split('#')[1];
      const queryPart = url.split('?')[1]?.split('#')[0];

      console.log('Hash part:', hashPart);
      console.log('Query part:', queryPart);

      // Try hash params first (OAuth implicit flow), then query params
      const params = new URLSearchParams(hashPart || queryPart || '');

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      console.log('Access token present:', !!accessToken);
      console.log('Refresh token present:', !!refreshToken);
      console.log('Error:', error);

      if (error) {
        Alert.alert('Login Error', errorDescription || error);
        return;
      }

      if (accessToken && refreshToken) {
        console.log('Setting session with tokens...');
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          Alert.alert('Session Error', sessionError.message);
        } else {
          console.log('Session set successfully:', data.user?.email);
          Alert.alert('Success', `Logged in as ${data.user?.email}`);
        }
      } else {
        console.log('No tokens found in URL');
        // Maybe it's using PKCE flow with code
        const code = params.get('code');
        if (code) {
          console.log('Found authorization code, exchanging...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            Alert.alert('Auth Error', exchangeError.message);
          } else {
            console.log('Code exchanged successfully:', data.user?.email);
            Alert.alert('Success', `Logged in as ${data.user?.email}`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      Alert.alert('Error', String(error));
    }
  }
}
