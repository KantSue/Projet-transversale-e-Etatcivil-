import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';

const ACTION_COULEUR: any = {
  'VALIDER': '#27ae60',
  'REFUSER': '#e74c3c',
};

const ACTION_EMOJI: any = {
  'VALIDER': '✅',
  'REFUSER': '❌',
};

export default function HistoriqueScreen() {
  const router = useRouter();
  const [historique, setHistorique] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/dashboard/demandes/historique/').then(res => {
      setHistorique(res.data.historique);
    }).catch(() => {
      Alert.alert('Erreur', 'Impossible de charger l\'historique.');
    }).finally(() => setLoading(false));
  }, []);

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
        <Text style={styles.titre}>Mes actions</Text>
        <Text style={styles.sousTitre}>{historique.length} action(s) effectuée(s)</Text>
      </View>

      {historique.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videEmoji}>📋</Text>
          <Text style={styles.videText}>Aucune action enregistrée.</Text>
        </View>
      ) : (
        historique.map((h: any, i: number) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.actionBadge, { backgroundColor: ACTION_COULEUR[h.action] || '#7f8c8d' }]}>
                <Text style={styles.actionText}>
                  {ACTION_EMOJI[h.action] || '📄'} {h.action}
                </Text>
              </View>
              <Text style={styles.date}>
                {h.horodatage?.split('T')[0] || h.horodatage?.split(' ')[0]}
              </Text>
            </View>

            <Text style={styles.numDemande}>{h.num_demande}</Text>
            <Text style={styles.typeActe}>{h.type_acte}</Text>
            <Text style={styles.citoyen}>👤 {h.citoyen}</Text>

            {h.motif && (
              <View style={styles.motifContainer}>
                <Text style={styles.motifLabel}>Motif :</Text>
                <Text style={styles.motif}>{h.motif}</Text>
              </View>
            )}
          </View>
        ))
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
  vide           : { alignItems: 'center', marginTop: 80 },
  videEmoji      : { fontSize: 48, marginBottom: 12 },
  videText       : { fontSize: 16, color: '#7f8c8d' },
  card           : { backgroundColor: '#fff', margin: 12, marginBottom: 6, borderRadius: 12, padding: 16, elevation: 3 },
  cardHeader     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  actionBadge    : { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  actionText     : { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  date           : { fontSize: 12, color: '#95a5a6' },
  numDemande     : { fontSize: 14, fontWeight: 'bold', color: '#1a5276', marginBottom: 4 },
  typeActe       : { fontSize: 13, color: '#7f8c8d', marginBottom: 4 },
  citoyen        : { fontSize: 13, color: '#2c3e50', marginBottom: 4 },
  motifContainer : { backgroundColor: '#fef9e7', borderRadius: 8, padding: 8, marginTop: 6 },
  motifLabel     : { fontSize: 11, color: '#e67e22', fontWeight: 'bold' },
  motif          : { fontSize: 12, color: '#2c3e50', marginTop: 2 },
});