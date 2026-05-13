import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUT_COULEUR: any = {
  'EN ATTENTE': '#e67e22',
  'VALIDER'   : '#27ae60',
  'REFUSER'   : '#e74c3c',
  'TERMINER'  : '#8e44ad',
};

const STATUT_EMOJI: any = {
  'EN ATTENTE': '⏳',
  'VALIDER'   : '✅',
  'REFUSER'   : '❌',
  'TERMINER'  : '📄',
};

export default function SuiviScreen() {
  const router = useRouter();
  const [demandes, setDemandes]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    api.get('/dashboard/demandes/citoyen/').then(res => {
      setDemandes(res.data);
    }).catch(() => {
      Alert.alert('Erreur', 'Impossible de charger vos demandes.');
    }).finally(() => setLoading(false));
  }, []);

  const telechargerPDF = async (id_demande: number, num_demande: string) => {
    setDownloading(id_demande);
    try {
      // Récupérer l'URL du PDF
      const res = await api.get(`/dashboard/demandes/${id_demande}/pdf/`);
      const url_pdf = res.data.url_pdf;

      if (!url_pdf) {
        Alert.alert('Erreur', 'PDF non disponible.');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      const documentDirectory = (FileSystem as any).documentDirectory ?? '';
      const dest = documentDirectory + `acte_${num_demande}.pdf`;

      const download = await FileSystem.downloadAsync(
        url_pdf,
        dest,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (download.status === 200) {
        await Sharing.shareAsync(download.uri, {
          mimeType   : 'application/pdf',
          dialogTitle: 'Mon acte d\'état civil',
        });
      } else {
        Alert.alert('Erreur', 'Téléchargement échoué.');
      }
    } catch (err: any) {
      console.log('ERREUR DOWNLOAD:', err.message || err);
      Alert.alert('Erreur', 'Impossible de télécharger le PDF.');
    } finally {
      setDownloading(null);
    }
  };

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
        <Text style={styles.titre}>Mes demandes</Text>
      </View>

      {demandes.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videText}>📭 Aucune demande pour le moment.</Text>
        </View>
      ) : (
        demandes.map((d: any) => (
          <View key={d.id_demande} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.numDemande}>{d.num_demande}</Text>
              <View style={[styles.badge, { backgroundColor: STATUT_COULEUR[d.statut_demande] || '#95a5a6' }]}>
                <Text style={styles.badgeText}>
                  {STATUT_EMOJI[d.statut_demande]} {d.statut_demande}
                </Text>
              </View>
            </View>
            <Text style={styles.typeActe}>{d.type_acte || 'N/A'}</Text>
            <Text style={styles.date}>Déposée le : {d.date_depot}</Text>
            {d.motif_refus && (
              <Text style={styles.motif}>Motif refus : {d.motif_refus}</Text>
            )}

            {/* Bouton télécharger si TERMINER */}
            {d.statut_demande === 'TERMINER' && (
              <TouchableOpacity
                style={styles.btnPDF}
                onPress={() => telechargerPDF(d.id_demande, d.num_demande)}
                disabled={downloading === d.id_demande}
              >
                {downloading === d.id_demande
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnPDFText}>📄 Télécharger mon acte</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: '#f0f4f8' },
  center     : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header     : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour     : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre      : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  vide       : { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  videText   : { fontSize: 16, color: '#7f8c8d' },
  card       : { backgroundColor: '#fff', margin: 12, marginBottom: 6, borderRadius: 12, padding: 16, elevation: 3 },
  cardHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  numDemande : { fontSize: 14, fontWeight: 'bold', color: '#1a5276' },
  badge      : { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText  : { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  typeActe   : { fontSize: 14, color: '#2c3e50', marginBottom: 4 },
  date       : { fontSize: 12, color: '#95a5a6' },
  motif      : { fontSize: 12, color: '#e74c3c', marginTop: 6, fontStyle: 'italic' },
  btnPDF     : { backgroundColor: '#8e44ad', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  btnPDFText : { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});