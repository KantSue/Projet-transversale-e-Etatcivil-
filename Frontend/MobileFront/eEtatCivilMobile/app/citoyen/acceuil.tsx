import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';

export default function AccueilScreen() {
  const router = useRouter();
  const [nom, setNom]         = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      if (!token) { router.replace('/login' as any); return; }
      api.get('/accounts/profil/').then(res => {
        setNom(`${res.data.nom_user} ${res.data.prenom_user}`);
      }).finally(() => setLoading(false));
    });
  }, []);

  const deconnexion = async () => {
    await AsyncStorage.clear();
    router.replace('/login' as any);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a5276" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.titre}>Bonjour 👋</Text>
        <Text style={styles.nom}>{nom}</Text>
        <TouchableOpacity style={styles.btnDeco} onPress={deconnexion}>
          <Text style={styles.btnDecoText}>Déconnexion</Text>
        </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profil' as any)}>
          <Text style={{ color: '#aed6f1', fontSize: 13 }}>👤 Mon profil</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <Text style={styles.sectionTitre}>Que souhaitez-vous faire ?</Text>

      <View style={styles.actions}>

        <TouchableOpacity
          style={[styles.carte, { backgroundColor: '#1a5276' }]}
          onPress={() => router.push('/citoyen/demande' as any)}
        >
          <Text style={styles.carteIcon}>📋</Text>
          <Text style={styles.carteTitre}>Nouvelle demande</Text>
          <Text style={styles.carteSousTitre}>{"Déposer un acte d'état civil"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.carte, { backgroundColor: '#27ae60' }]}
          onPress={() => router.push('/citoyen/suivi' as any)}
        >
          <Text style={styles.carteIcon}>🔍</Text>
          <Text style={styles.carteTitre}>Suivi demandes</Text>
          <Text style={styles.carteSousTitre}>{"Voir l'état de vos demandes"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.carte, { backgroundColor: '#2980b9' }]}
          onPress={() => router.push('/citoyen/arrondissements' as any)}
        >
          <Text style={styles.carteIcon}>🏛️</Text>
          <Text style={styles.carteTitre}>Arrondissements</Text>
          <Text style={styles.carteSousTitre}>Voir les bureaux disponibles près de vous</Text>
        </TouchableOpacity>


        </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#f0f4f8' },
  center       : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header       : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  titre        : { fontSize: 20, color: '#aed6f1' },
  nom          : { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  btnDeco      : { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnDecoText  : { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionTitre : { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', margin: 20 },
  actions      : { paddingHorizontal: 16, gap: 16 },
  carte        : { borderRadius: 16, padding: 24, elevation: 3 },
  carteIcon    : { fontSize: 36, marginBottom: 12 },
  carteTitre   : { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  carteSousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});