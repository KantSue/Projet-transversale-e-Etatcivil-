import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';

export default function ArrondissementsScreen() {
  const router = useRouter();
  const [arrondissements, setArr] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
const [commune, setCommune] = useState('');
useEffect(() => {
  api.get('/dashboard/arrondissements/public/').then(res => {
    setArr(res.data);
    // Récupérer le nom de la commune du premier résultat
    if (res.data.length > 0) {
      setCommune(res.data[0].commune);
    }
  }).catch(() => {
    Alert.alert('Erreur', 'Impossible de charger les arrondissements.');
  }).finally(() => setLoading(false));
}, []);

  const filtres = arrondissements.filter(a =>
    a.nom_arondissement?.toLowerCase().includes(query.toLowerCase()) ||
    a.commune?.toLowerCase().includes(query.toLowerCase())
  );

  const disponibles   = filtres.filter(a => a.statut === 'disponible');
  const indisponibles = filtres.filter(a => a.statut !== 'disponible');

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a5276" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Arrondissements</Text>
        <Text style={styles.sousTitre}>
          {disponibles.length} disponible(s) sur {arrondissements.length}
        </Text>
        <Text style={styles.sousTitre}>
        {commune ? `📍 ${commune}` : ''} — {disponibles.length} disponible(s) sur {arrondissements.length}
        </Text>
      </View>

      {/* Barre recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher par nom ou commune..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Disponibles */}
      <Text style={styles.sectionTitre}>
        ✅ Disponibles ({disponibles.length})
      </Text>
      {disponibles.map((a: any) => (
        <View key={a.id_arondissement} style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardNom}>{a.nom_arondissement}</Text>
            <Text style={styles.cardCommune}>🏛️ {a.commune}</Text>
          </View>
          <View style={styles.badgeDispo}>
            <Text style={styles.badgeText}>✅ Ouvert</Text>
          </View>
        </View>
      ))}

      {/* Indisponibles */}
      {indisponibles.length > 0 && (
        <>
          <Text style={styles.sectionTitre}>
            ❌ Indisponibles ({indisponibles.length})
          </Text>
          {indisponibles.map((a: any) => (
            <View key={a.id_arondissement} style={[styles.card, styles.cardIndispo]}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardNom, { color: '#7f8c8d' }]}>
                  {a.nom_arondissement}
                </Text>
                <Text style={styles.cardCommune}>🏛️ {a.commune}</Text>
              </View>
              <View style={styles.badgeIndispo}>
                <Text style={styles.badgeText}>❌ Fermé</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#f0f4f8' },
  center         : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header         : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour         : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre          : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sousTitre      : { fontSize: 13, color: '#aed6f1', marginTop: 4 },
  searchContainer: { margin: 16, marginBottom: 8 },
  searchInput    : { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', elevation: 2 },
  sectionTitre   : { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  card           : { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIndispo    : { opacity: 0.7 },
  cardLeft       : { flex: 1 },
  cardNom        : { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  cardCommune    : { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  badgeDispo     : { backgroundColor: '#27ae60', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeIndispo   : { backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText      : { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});