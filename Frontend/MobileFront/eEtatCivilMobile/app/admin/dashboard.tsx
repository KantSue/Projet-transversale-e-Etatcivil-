import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Switch, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';
import { Picker } from '@react-native-picker/picker';

type Onglet = 'stats' | 'citoyens' | 'agents' | 'communes' | 'archives';

export default function DashboardScreen() {
  const router = useRouter();
  const [onglet, setOnglet]               = useState<Onglet>('stats');
  const [stats, setStats]                 = useState<any>(null);
  const [citoyens, setCitoyens]           = useState<any[]>([]);
  const [agents, setAgents]               = useState<any[]>([]);
  const [arrondissements, setArr]         = useState<any[]>([]);
  const [communes, setCommunes]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingSwitch, setLoadingSwitch] = useState<number | null>(null);
  const [showForm, setShowForm]           = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [form, setForm] = useState({
    nom_user: '', prenom_user: '', email: '',
    matricule: '', id_arondissement: '', id_commune: ''
  });

  useEffect(() => { chargerTout(); }, []);

  const chargerTout = async () => {
    setLoading(true);
    try {
      const [resStats, resCitoyens, resAgents, resArr, resCommunes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/dashboard/citoyens/'),
        api.get('/dashboard/agents/'),
        api.get('/dashboard/arrondissements/'),
        api.get('/accounts/communes/'),
      ]);
      setStats(resStats.data);
      setCitoyens(resCitoyens.data.results || resCitoyens.data);
      setAgents(resAgents.data.results || resAgents.data);
      setArr(resArr.data);
      setCommunes(resCommunes.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const changerStatut = async (id: number, statutActuel: string) => {
    const nouveau = statutActuel === 'disponible' ? 'indisponible' : 'disponible';
    setLoadingSwitch(id);
    try {
      await api.patch(`/dashboard/arrondissements/${id}/`, { statut: nouveau });
      setArr(prev => prev.map(a =>
        a.id_arondissement === id ? { ...a, statut: nouveau } : a
      ));
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le statut.');
    } finally {
      setLoadingSwitch(null);
    }
  };

  const creerAgent = async () => {
    if (!form.nom_user || !form.prenom_user || !form.email || !form.matricule || !form.id_commune) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }
    setCreatingAgent(true);
    try {
      await api.post('/accounts/agents/', {
        nom_user         : form.nom_user,
        prenom_user      : form.prenom_user,
        email            : form.email,
        matricule        : parseInt(form.matricule),
        id_commune       : parseInt(form.id_commune),
        id_arondissement : form.id_arondissement ? parseInt(form.id_arondissement) : null,
      });
      Alert.alert('Succès ✅', 'Agent créé — mot de passe envoyé par email.');
      setForm({ nom_user: '', prenom_user: '', email: '', matricule: '', id_arondissement: '', id_commune: '' });
      setShowForm(false);
      chargerTout();
    } catch (err: any) {
      Alert.alert('Erreur', JSON.stringify(err.response?.data || 'Erreur création'));
    } finally {
      setCreatingAgent(false);
    }
  };

  const supprimerAgent = async (id_agent: number) => {
    Alert.alert('Confirmer', 'Supprimer cet agent ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/dashboard/agents/${id_agent}/`);
            Alert.alert('Succès', 'Agent supprimé.');
            chargerTout();
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        }
      }
    ]);
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
    <View style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.titre}>Tableau de bord</Text>
        <Text style={styles.sousTitre}>Administrateur</Text>
        <TouchableOpacity style={styles.btnDeco} onPress={deconnexion}>
          <Text style={styles.btnDecoText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Onglets */}
          <View style={styles.onglets}>
      {(['stats', 'citoyens', 'agents', 'communes', 'archives'] as Onglet[]).map(o => (
        <TouchableOpacity
          key={o}
          style={[styles.onglet, onglet === o && styles.ongletActif]}
          onPress={() => {
            if (o === 'archives') {
              router.push('/archives' as any);
              return;
            }
            setOnglet(o);
          }}
        >
          <Text style={[styles.ongletText, onglet === o && styles.ongletTextActif]}>
            {o === 'stats'    ? '📊' :
            o === 'citoyens' ? '👤' :
            o === 'agents'   ? '🧑‍💼' :
            o === 'communes' ? '🏛️' : '🗄️'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

      <ScrollView style={{ flex: 1 }}>

        {/* ── STATS ── */}
        {onglet === 'stats' && stats && (
          <View>
            <Text style={styles.sectionTitre}>Demandes</Text>
            <View style={styles.cardsRow}>
              <Carte label="Total"      valeur={stats.demandes.total}      couleur="#1a5276" />
              <Carte label="En attente" valeur={stats.demandes.en_attente} couleur="#e67e22" />
            </View>
            <View style={styles.cardsRow}>
              <Carte label="Validées"  valeur={stats.demandes.valider}  couleur="#27ae60" />
              <Carte label="Refusées"  valeur={stats.demandes.refuser}  couleur="#e74c3c" />
            </View>
            <View style={styles.cardsRow}>
              <Carte label="Terminées"  valeur={stats.demandes.terminer}      couleur="#8e44ad" />
              <Carte label="Délai moy." valeur={`${stats.delai_moyen_jours}j`} couleur="#2980b9" />
            </View>

            <Text style={styles.sectionTitre}>Paiements</Text>
            <View style={styles.cardsRow}>
              <Carte label="Confirmés"     valeur={stats.paiements.total_confirme}       couleur="#27ae60" />
              <Carte label="Montant total" valeur={`${stats.paiements.montant_total} Ar`} couleur="#1a5276" />
            </View>

            <Text style={styles.sectionTitre}>{"Par type d'acte"}</Text>
            {stats.par_type.map((t: any, i: number) => (
              <View key={i} style={styles.ligne}>
                <Text style={styles.ligneLabel}>{t.libelle}</Text>
                <Text style={styles.ligneValeur}>{t.total}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitre}>Actions récentes</Text>
            {stats.journal_recent.map((j: any, i: number) => (
              <View key={i} style={styles.journalItem}>
                <Text style={styles.journalAgent}>{j.agent}</Text>
                <Text style={[styles.journalAction, {
                  color: j.action === 'VALIDER' ? '#27ae60' : j.action === 'REFUSER' ? '#e74c3c' : '#2980b9'
                }]}>{j.action}</Text>
                <Text style={styles.journalDate}>{j.date}</Text>
              </View>
            ))}
          </View>
        )}
       

        {/* ── CITOYENS ── */}
        {onglet === 'citoyens' && (
          <View>
            <Text style={styles.sectionTitre}>Citoyens ({citoyens.length})</Text>
            {citoyens.map((c: any, i: number) => (
              <View key={i} style={styles.membreCard}>
                <Text style={styles.membreNom}>
                  {c.id_user.prenom_user} {c.id_user.nom_user}
                </Text>
                <Text style={styles.membreEmail}>{c.id_user.email}</Text>
                <Text style={styles.membreInfo}>
                  {c.id_user.commune}{c.id_user.arrondissement ? ` — ${c.id_user.arrondissement}` : ''}
                </Text>
                <Text style={styles.membreInfo}>Inscrit le : {c.id_user.date_inscription}</Text>
                <View style={styles.demandesRow}>
                  <StatBadge label="Total"     valeur={c.demandes.total}      couleur="#1a5276" />
                  <StatBadge label="Attente"   valeur={c.demandes.en_attente} couleur="#e67e22" />
                  <StatBadge label="Validées"  valeur={c.demandes.valider}    couleur="#27ae60" />
                  <StatBadge label="Terminées" valeur={c.demandes.terminer}   couleur="#8e44ad" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── AGENTS ── */}
        {onglet === 'agents' && (
          <View>
            <View style={styles.agentsHeader}>
              <Text style={styles.sectionTitre}>Agents ({agents.length})</Text>
              <TouchableOpacity
                style={styles.btnNouvelAgent}
                onPress={() => setShowForm(!showForm)}
              >
                <Text style={styles.btnNouvelAgentText}>
                  {showForm ? '✕ Annuler' : '➕ Nouvel agent'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Formulaire — visible uniquement si showForm */}
            {showForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitre}>Créer un agent</Text>

                <TextInput style={styles.input} placeholder="Nom"
                  value={form.nom_user} onChangeText={v => setForm({...form, nom_user: v})} />
                <TextInput style={styles.input} placeholder="Prénom"
                  value={form.prenom_user} onChangeText={v => setForm({...form, prenom_user: v})} />
                <TextInput style={styles.input} placeholder="Email"
                  value={form.email} onChangeText={v => setForm({...form, email: v})}
                  keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Matricule"
                  value={form.matricule} onChangeText={v => setForm({...form, matricule: v})}
                  keyboardType="numeric" />

                <Text style={styles.pickerLabel}>Commune</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.id_commune}
                    onValueChange={v => setForm({ ...form, id_commune: v, id_arondissement: '' })}
                  >
                    <Picker.Item label="Sélectionner une commune..." value="" />
                    {communes.map((c: any) => (
                      <Picker.Item key={c.id_commune} label={c.nom_commune} value={String(c.id_commune)} />
                    ))}
                  </Picker>
                </View>

                {form.id_commune &&
                  communes.find((c: any) => String(c.id_commune) === form.id_commune)?.arrondissements?.length > 0 && (
                  <>
                    <Text style={styles.pickerLabel}>Arrondissement</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={form.id_arondissement}
                        onValueChange={v => setForm({ ...form, id_arondissement: v })}
                      >
                        <Picker.Item label="Sélectionner un arrondissement..." value="" />
                        {communes
                          .find((c: any) => String(c.id_commune) === form.id_commune)
                          ?.arrondissements?.map((a: any) => (
                            <Picker.Item key={a.id_arondissement} label={a.nom_arondissement} value={String(a.id_arondissement)} />
                          ))
                        }
                      </Picker>
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.btnCreer} onPress={creerAgent} disabled={creatingAgent}>
                  {creatingAgent
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnCreerText}>{"Créer l'agent"}</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {/* Liste agents */}
            {agents.map((a: any, i: number) => (
              <View key={i} style={styles.membreCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.membreNom}>{a.prenom_user} {a.nom_user}</Text>
                    <Text style={styles.membreEmail}>{a.email}</Text>
                    <Text style={styles.membreInfo}>{a.arrondissement} — {a.commune}</Text>
                  </View>
                  <TouchableOpacity style={styles.btnSuppr} onPress={() => supprimerAgent(a.id_agent)}>
                    <Text style={styles.btnSupprText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── COMMUNES / ARRONDISSEMENTS ── */}
        {onglet === 'communes' && (
          <View>
            <Text style={styles.sectionTitre}>Arrondissements</Text>
            <Text style={styles.info}>
              Activez ou désactivez un arrondissement. Les citoyens seront redirigés vers le plus proche disponible.
            </Text>
            {arrondissements.map((a: any) => (
              <View key={a.id_arondissement} style={styles.arrCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.arrNom}>{a.nom_arondissement}</Text>
                  <Text style={styles.arrCommune}>{a.commune}</Text>
                  <View style={[styles.arrBadge, {
                    backgroundColor: a.statut === 'disponible' ? '#27ae60' : '#e74c3c'
                  }]}>
                    <Text style={styles.arrBadgeText}>
                      {a.statut === 'disponible' ? '✅ Disponible' : '❌ Indisponible'}
                    </Text>
                  </View>
                </View>
                {loadingSwitch === a.id_arondissement
                  ? <ActivityIndicator color="#1a5276" />
                  : <Switch
                      value={a.statut === 'disponible'}
                      onValueChange={() => changerStatut(a.id_arondissement, a.statut)}
                      trackColor={{ false: '#e74c3c', true: '#27ae60' }}
                      thumbColor="#fff"
                    />
                }
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Carte({ label, valeur, couleur }: { label: string, valeur: any, couleur: string }) {
  return (
    <View style={[styles.carte, { borderLeftColor: couleur }]}>
      <Text style={styles.carteValeur}>{valeur}</Text>
      <Text style={styles.carteLabel}>{label}</Text>
    </View>
  );
}

function StatBadge({ label, valeur, couleur }: { label: string, valeur: number, couleur: string }) {
  return (
    <View style={[styles.statBadge, { backgroundColor: couleur }]}>
      <Text style={styles.statBadgeValeur}>{valeur}</Text>
      <Text style={styles.statBadgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#f0f4f8' },
  center         : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header         : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  titre          : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sousTitre      : { fontSize: 13, color: '#aed6f1', marginTop: 4 },
  btnDeco        : { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnDecoText    : { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  onglets        : { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  onglet         : { flex: 1, alignItems: 'center', paddingVertical: 12 },
  ongletActif    : { borderBottomWidth: 3, borderBottomColor: '#1a5276' },
  ongletText     : { fontSize: 20 },
  ongletTextActif: { fontSize: 22 },
  sectionTitre   : { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginTop: 20, marginBottom: 10, marginHorizontal: 16 },
  info           : { fontSize: 12, color: '#7f8c8d', marginHorizontal: 16, marginBottom: 12 },
  cardsRow       : { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  carte          : { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, elevation: 2 },
  carteValeur    : { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  carteLabel     : { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  ligne          : { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 6, padding: 14, borderRadius: 10, elevation: 1 },
  ligneLabel     : { fontSize: 14, color: '#2c3e50' },
  ligneValeur    : { fontSize: 14, fontWeight: 'bold', color: '#1a5276' },
  journalItem    : { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 6, padding: 12, borderRadius: 10, elevation: 1 },
  journalAgent   : { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },
  journalAction  : { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  journalDate    : { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  membreCard     : { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 2 },
  membreNom      : { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  membreEmail    : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  membreInfo     : { fontSize: 12, color: '#1a5276', marginTop: 4 },
  demandesRow    : { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  statBadge      : { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', minWidth: 55 },
  statBadgeValeur: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statBadgeLabel : { color: '#fff', fontSize: 9, marginTop: 1 },
  agentsHeader   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 16 },
  btnNouvelAgent : { backgroundColor: '#1a5276', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnNouvelAgentText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  formCard       : { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 3, marginBottom: 8 },
  formTitre      : { fontSize: 15, fontWeight: 'bold', color: '#1a5276', marginBottom: 12 },
  input          : { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 14, color: '#2c3e50' },
  btnCreer       : { backgroundColor: '#27ae60', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  btnCreerText   : { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  btnSuppr       : { padding: 8 },
  btnSupprText   : { fontSize: 20 },
  pickerLabel    : { fontSize: 13, color: '#7f8c8d', marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8, backgroundColor: '#fafafa' },
  arrCard        : { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  arrNom         : { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  arrCommune     : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  arrBadge       : { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' },
  arrBadgeText   : { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  btnArchive     : { backgroundColor: '#1a5276', borderRadius: 12, padding: 16, alignItems: 'center', margin: 16 },
  btnArchiveText : { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});