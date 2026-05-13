import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/config/api';

export default function MotDePasseOublieScreen() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const envoyer = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/accounts/mot-de-passe-oublie/', { email });
      Alert.alert(
        'Succès ✅',
        'Un nouveau mot de passe a été envoyé à votre email.',
        [{ text: 'OK', onPress: () => router.replace('/login' as any) }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Email introuvable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Mot de passe oublié</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.info}>
          Entrez votre email. Si un compte existe, vous recevrez un nouveau mot de passe.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.mg"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={envoyer}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>📧 Envoyer le nouveau mot de passe</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: '#f0f4f8' },
  header    : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour    : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre     : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card      : { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, elevation: 3 },
  info      : { fontSize: 13, color: '#7f8c8d', marginBottom: 16, lineHeight: 20 },
  label     : { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 6 },
  input     : { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', backgroundColor: '#f8f9fa', marginBottom: 16 },
  btn       : { backgroundColor: '#1a5276', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText   : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});