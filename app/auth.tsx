import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signUp } from '../lib/auth';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Moralarms</Text>
        <Text style={styles.subtitle}>{mode === 'signin' ? 'Sign in' : 'Create an account'}</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#8E8E93"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#8E8E93"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.submit, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{mode === 'signin' ? 'Sign in' : 'Sign up'}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: { width: '100%', maxWidth: 420, padding: 8 },
  title: { color: '#FF9500', fontSize: 36, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  label: { color: '#8E8E93', fontSize: 13, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#F2F2F7',
    color: '#1C1C1E',
    fontSize: 17,
    padding: 14,
    borderRadius: 10,
  },
  error: { color: '#FF3B30', fontSize: 14, marginTop: 12 },
  submit: {
    marginTop: 22,
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  toggle: { marginTop: 14, alignItems: 'center' },
  toggleText: { color: '#FF9500', fontSize: 15, fontWeight: '600' },
});
