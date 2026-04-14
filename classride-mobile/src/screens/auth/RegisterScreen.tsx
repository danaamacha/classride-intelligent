import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import api from '../../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName,
        phoneNumber,
        password,
        role: 'pending',
      });

      Alert.alert(
        'Success! 🎉',
        'Account created successfully. Please login.',
        [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🚌</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join ClassRide today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ahmad Khalil"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 70123456"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginTextBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 16 },
  loginText: { color: '#64748B', fontSize: 14 },
  loginTextBold: { color: '#2563EB', fontWeight: '700' },
});