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
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function LoginScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { phoneNumber, password });
      await login(response.data);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (phone: string, pass: string) => {
    setPhoneNumber(phone);
    setPassword(pass);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Logo / Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>🚌</Text>
          <Text style={styles.title}>ClassRide</Text>
          <Text style={styles.subtitle}>Smart Transportation Platform</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 70123456"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerTextBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Login Buttons (remove before launch) */}
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>⚡ Quick Login (Dev Only)</Text>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => quickLogin('70123456', '123456')}
          >
            <Text style={styles.devBtnText}>👑 Owner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => quickLogin('70999888', '7010xt57')}
          >
            <Text style={styles.devBtnText}>🚌 Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => quickLogin('70111222', 'ea2jp9f7')}
          >
            <Text style={styles.devBtnText}>🎓 Student</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#64748B',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#2563EB',
    fontWeight: '700',
  },
  devSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  devTitle: {
    fontSize: 12,
    color: '#854D0E',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  devBtn: {
    backgroundColor: '#FEF08A',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  devBtnText: { color: '#854D0E', fontWeight: '700' },
});