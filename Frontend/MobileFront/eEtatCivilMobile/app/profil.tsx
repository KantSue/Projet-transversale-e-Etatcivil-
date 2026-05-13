import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import api from '../src/config/api';

export default function ProfilScreen() {
  const router = useRouter();
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [role, setRole]           = useState('');
  const [communes, setCommunes]   = useState<any[]>([]);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [ancienMdp, setAncienMdp]   = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');

  const [form, setForm] = useState({
    nom_user        : '',
    prenom_user     : '',
    mdp_user        : '',
    mdp_confirm     : '',
    id_commune      : '',
    id_arondissement: '',
  });

  useEffect(() => {
    const charger = async () => {
      const r = await AsyncStorage.getItem('role') || '';
      setRole(r);

      const [resProfil, resCommunes] = await Promise.all([
        api.get('/accounts/profil/'),
        api.get('/accounts/communes/'),
      ]);

      const p = resProfil.data;
      setForm({
        nom_user        : p.nom_user || '',
        prenom_user     : p.prenom_user || '',
        mdp_user        : '',
        mdp_confirm     : '',
        id_commune      : String(p.id_commune?.id_commune || ''),
        id_arondissement: String(p.id_arondissement?.id_arondissement || ''),
      });

      setCommunes(resCommunes.data);

      // Charger arrondissements de la commune actuelle
      if (p.id_commune?.id_commune) {
        const c = resCommunes.data.find(
          (c: any) => c.id_commune === p.id_commune.id_commune
        );
        setArrondissements(c?.arrondissements || []);
      }

      setLoading(false);
    };

    charger().catch(() => {
      Alert.alert('Erreur', 'Impossible de charger le profil.');
      setLoading(false);
    });
  }, []);

  const onCommuneChange = (id: string) => {
    setForm({ ...form, id_commune: id, id_arondissement: '' });
    const c = communes.find((c: any) => String(c.id_commune) === id);
    setArrondissements(c?.arrondissements || []);
  };
    const sauvegarder = async () => {
      // Vérifications mot de passe
      if (nouveauMdp) {
        if (!ancienMdp) {
          Alert.alert('Erreur', 'Veuillez entrer votre ancien mot de passe.');
          return;
        }
        if (nouveauMdp !== confirmMdp) {
          Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
          return;
        }
      }

      setSaving(true);
      try {
        const data: any = {
          nom_user   : form.nom_user,
          prenom_user: form.prenom_user,
        };

        // Ajouter mot de passe si changement demandé
        if (nouveauMdp) {
          data.ancien_mdp = ancienMdp;
          data.mdp_user   = nouveauMdp;
        }

        // Localisation — citoyen seulement
        if (role.toLowerCase() === 'citoyen') {
          if (form.id_commune) data.id_commune = parseInt(form.id_commune);
          if (form.id_arondissement) data.id_arondissement = parseInt(form.id_arondissement);
          else data.id_arondissement = null;
        }

        const res = await api.patch('/accounts/profil/', data);

        // Mettre à jour le token
        if (res.data.token) {
          await AsyncStorage.setItem('token', res.data.token);
        }

        Alert.alert('Succès ✅', 'Profil mis à jour.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (err: any) {
        Alert.alert('Erreur', JSON.stringify(err.response?.data || 'Erreur'));
      } finally {
        setSaving(false);
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
        <Text style={styles.titre}>Mon profil</Text>
        <Text style={styles.sousTitre}>
          {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitre}>Informations personnelles</Text>

        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={form.nom_user}
          onChangeText={v => setForm({ ...form, nom_user: v })}
          placeholder="Nom"
        />

        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          value={form.prenom_user}
          onChangeText={v => setForm({ ...form, prenom_user: v })}
          placeholder="Prénom"
        />
      </View>

      {/* Commune/Arrondissement — citoyen seulement */}
      {role.toLowerCase() === 'citoyen' && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Localisation</Text>

          <Text style={styles.label}>Commune</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.id_commune}
              onValueChange={onCommuneChange}
            >
              <Picker.Item label="-- Choisir une commune --" value="" />
              {communes.map((c: any) => (
                <Picker.Item
                  key={c.id_commune}
                  label={c.nom_commune}
                  value={String(c.id_commune)}
                />
              ))}
            </Picker>
          </View>

          {arrondissements.length > 0 && (
            <>
              <Text style={styles.label}>Arrondissement</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.id_arondissement}
                  onValueChange={v => setForm({ ...form, id_arondissement: v })}
                >
                  <Picker.Item label="-- Choisir un arrondissement --" value="" />
                  {arrondissements.map((a: any) => (
                    <Picker.Item
                      key={a.id_arondissement}
                      label={a.nom_arondissement}
                      value={String(a.id_arondissement)}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </View>
      )}

      {/* Mot de passe */}
     
      <TouchableOpacity
        style={styles.btnSauvegarder}
        onPress={sauvegarder}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnSauvegarderText}>💾 Sauvegarder</Text>
        }
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitre}>Changer le mot de passe</Text>
        <Text style={styles.info}>Laissez vide pour ne pas changer.</Text>

        <Text style={styles.label}>Ancien mot de passe</Text>
        <TextInput
          style={styles.input}
          value={ancienMdp}
          onChangeText={setAncienMdp}
          placeholder="Ancien mot de passe"
          secureTextEntry
        />

        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput
          style={styles.input}
          value={nouveauMdp}
          onChangeText={setNouveauMdp}
          placeholder="Nouveau mot de passe"
          secureTextEntry
        />

        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput
          style={styles.input}
          value={confirmMdp}
          onChangeText={setConfirmMdp}
          placeholder="Confirmer le nouveau mot de passe"
          secureTextEntry
        />

        {/* Mot de passe oublié */}
        <TouchableOpacity
          style={styles.lienOublie}
          onPress={() => router.push('/mot-de-passe-oublie' as any)}
        >
          <Text style={styles.lienOublieText}>🔑 Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container        : { flex: 1, backgroundColor: '#f0f4f8' },
  center           : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header           : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour           : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre            : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sousTitre        : { fontSize: 13, color: '#aed6f1', marginTop: 4 },
  card             : { backgroundColor: '#fff', margin: 12, marginBottom: 6, borderRadius: 12, padding: 16, elevation: 3 },
  cardTitre        : { fontSize: 15, fontWeight: 'bold', color: '#1a5276', marginBottom: 12 },
  label            : { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 6, marginTop: 8 },
  input            : { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', backgroundColor: '#f8f9fa' },
  info             : { fontSize: 12, color: '#7f8c8d', marginBottom: 8 },
  pickerWrapper    : { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#f8f9fa', marginBottom: 8 },
  btnSauvegarder   : { backgroundColor: '#27ae60', borderRadius: 12, padding: 16, alignItems: 'center', margin: 16 },
  btnSauvegarderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  lienOublie    : { alignItems: 'center', marginTop: 12 },
lienOublieText: { color: '#1a5276', fontSize: 13, fontWeight: 'bold' },
});