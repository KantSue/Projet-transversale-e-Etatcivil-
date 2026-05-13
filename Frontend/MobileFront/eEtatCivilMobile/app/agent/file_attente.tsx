import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/config/api';

const STATUT_COULEUR: any = {
  'EN ATTENTE': '#e67e22',
  'VALIDER'   : '#27ae60',
  'REFUSER'   : '#e74c3c',
  'TERMINER'  : '#8e44ad',
};

const TYPE_EMOJI: any = {
  'acte naissance': '👶',
  'acte décès'    : '🕊️',
  'acte mariage'  : '💍',
};

export default function FileAttenteScreen() {
  const router = useRouter();
  const [demandes, setDemandes]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentId, setAgentId]       = useState<number | null>(null);
  const [agentNom, setAgentNom]     = useState('');

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      if (!token) { router.replace('/login' as any); return; }
      api.get('/accounts/profil/').then(res => {
        setAgentId(res.data.id_user);
        setAgentNom(`${res.data.prenom_user || ''} ${res.data.nom_user || ''}`);
        chargerDemandes();
      });
    });
  }, []);

  const chargerDemandes = async () => {
    try {
      const res = await api.get('/dashboard/demandes/');
      setDemandes(res.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la file.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    chargerDemandes();
  };

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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.titre}>{"File d'attente"}</Text>
            <Text style={styles.agentNom}>👤 {agentNom}</Text>
          </View>
          <TouchableOpacity style={styles.btnDeco} onPress={deconnexion}>
            <Text style={styles.btnDecoText}>Déconnexion</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profil' as any)}>
        <Text style={{ color: '#aed6f1', fontSize: 13 }}>👤 Mon profil</Text>
      </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.btnAction}
            onPress={() => router.push('/archives' as any)}
          >
            <Text style={styles.btnActionText}>🗄️ Archives</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnAction}
            onPress={() => router.push('/agent/recherche' as any)}
          >
            <Text style={styles.btnActionText}>🔍 Recherche</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnAction}
            onPress={() => router.push('/agent/historique' as any)}
          >
            <Text style={styles.btnActionText}>📋 Historique</Text>
          </TouchableOpacity>
        </View>

        {/* Compteur */}
        <View style={styles.compteur}>
          <Text style={styles.compteurText}>
            {demandes.length} demande{demandes.length > 1 ? 's' : ''} en attente
          </Text>
        </View>
      </View>

      {demandes.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videEmoji}>✅</Text>
          <Text style={styles.videText}>Aucune demande en attente.</Text>
          <Text style={styles.videSubText}>Toutes les demandes ont été traitées.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitre}>
            Classées par ancienneté — priorité au plus ancien
          </Text>
          {demandes.map((d: any, index: number) => (
            <TouchableOpacity
              key={d.id_demande}
              style={[
                styles.card,
                index === 0 && styles.cardPrioritaire,
                index > 0 && styles.cardBloquee  // ← ajouter

              ]}
             onPress={() => {
              // Vérifier si la demande #1 est encore EN ATTENTE
              const premierEnAttente = demandes[0]?.statut_demande === 'EN ATTENTE';
              
              if (index === 0 || !premierEnAttente) {
                // Accès autorisé
                router.push({
                  pathname: '/agent/detail_demande' as any,
                  params: { id_demande: d.id_demande, id_agent: agentId }
                });
              } else {
                Alert.alert(
                  '⛔ Accès bloqué',
                  `Veuillez d'abord traiter la demande prioritaire #1 (${demandes[0].num_demande}) avant de passer à la suivante.`,
                  [{ text: 'Compris', style: 'default' }]
                );
              }
            }}
            >
              {/* Badge priorité */}
              <View style={[
                styles.priorite,
                index === 0 && styles.prioritePremier
              ]}>
                <Text style={styles.prioriteText}>#{index + 1}</Text>
                {index === 0 && <Text style={styles.prioriteUrgent}>🔥</Text>}
              </View>

              <View style={styles.cardContent}>
                {/* Ligne 1 */}
                <View style={styles.cardHeader}>
                  <Text style={styles.numDemande}>{d.num_demande}</Text>
                  <Text style={styles.typeActe}>
                    {TYPE_EMOJI[d.type_acte] || '📄'} {d.type_acte}
                  </Text>
                </View>

                {/* Citoyen */}
                <Text style={styles.citoyen}>👤 {d.citoyen}</Text>

                {/* Lieu */}
                <Text style={styles.commune}>
                  📍 {d.commune}{d.arrondissement ? ` — ${d.arrondissement}` : ''}
                </Text>

                {/* Date dépôt */}
                <Text style={styles.date}>
                  📅 Déposée le {d.date_depot?.split('T')[0]}
                </Text>

                {/* Numéro acte */}
                <Text style={styles.numActe}>🗂️ {d.num_acte}</Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
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
  headerTop      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titre          : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  agentNom       : { fontSize: 13, color: '#aed6f1', marginTop: 4 },
  btnDeco        : { backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnDecoText    : { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerActions  : { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnAction      : { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flex: 1, alignItems: 'center' },
  btnActionText  : { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  compteur       : { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, marginTop: 12, alignItems: 'center' },
  compteurText   : { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  sectionTitre   : { fontSize: 12, color: '#7f8c8d', margin: 16, marginBottom: 8, fontStyle: 'italic' },
  vide           : { alignItems: 'center', marginTop: 80 },
  videEmoji      : { fontSize: 48, marginBottom: 12 },
  videText       : { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  videSubText    : { fontSize: 14, color: '#7f8c8d' },
  card           : { backgroundColor: '#fff', margin: 12, marginBottom: 6, borderRadius: 12, padding: 16, elevation: 3, flexDirection: 'row', alignItems: 'center' },
  cardPrioritaire: { borderLeftWidth: 4, borderLeftColor: '#e74c3c', elevation: 5 },
  priorite       : { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a5276', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  prioritePremier: { backgroundColor: '#e74c3c' },
  prioriteText   : { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  prioriteUrgent : { fontSize: 10, marginTop: 0 },
  cardContent    : { flex: 1 },
  cardHeader     : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  numDemande     : { fontSize: 13, fontWeight: 'bold', color: '#1a5276' },
  typeActe       : { fontSize: 11, color: '#7f8c8d' },
  citoyen        : { fontSize: 13, fontWeight: 'bold', color: '#2c3e50', marginBottom: 3 },
  commune        : { fontSize: 12, color: '#2c3e50', marginBottom: 2 },
  date           : { fontSize: 11, color: '#95a5a6', marginBottom: 2 },
  numActe        : { fontSize: 11, color: '#8e44ad' },
  chevron        : { fontSize: 24, color: '#bdc3c7', marginLeft: 8 },
  cardBloquee: { opacity: 0.5 },
});