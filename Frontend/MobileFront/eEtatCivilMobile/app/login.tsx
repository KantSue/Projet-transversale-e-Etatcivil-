import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../src/config/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [mdp, setMdp]           = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !mdp) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/accounts/login/', {
        email,
        mdp_user: mdp
      });

      const { token, role } = res.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);

      if (role.toLowerCase() === 'citoyen') {
        router.replace('/citoyen/acceuil');
      } else if (role.toLowerCase() === 'agent') {
        router.replace('/agent/file_attente');
      } else {
        router.replace('/admin/dashboard');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.titre}>e-EtatCivil</Text>
        <Text style={styles.sousTitre}>Madagascar 2035</Text>
      </View>

      {/* Formulaire */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.mg"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          secureTextEntry
          value={mdp}
          onChangeText={setMdp}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Se connecter</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register' as any)}>
          <Text style={styles.lien}>{"Pas encore de compte ? S'inscrire"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/mot-de-passe-oublie' as any)}>
          <Text style={styles.lienOublie}>🔑 Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titre: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a5276',
  },
  sousTitre: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dde1e7',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  btn: {
    backgroundColor: '#1a5276',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  lien: {
    textAlign: 'center',
    color: '#1a5276',
    marginTop: 16,
    fontSize: 13,
  },
  lienOublie    : { alignItems: 'center', marginTop: 12 },
lienOublieText: { color: '#1a5276', fontSize: 13, fontWeight: 'bold' },
});