import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../src/config/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [communes, setCommunes]             = useState<any[]>([]);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [form, setForm] = useState({
    nom_user          : '',
    prenom_user       : '',
    email             : '',
    mdp_user          : '',
    id_commune        : null as number | null,
    id_arondissement : null as number | null,
  });
  const [loading, setLoading] = useState(false);

  // Charger les communes au démarrage
  useEffect(() => {
    api.get('/accounts/communes/').then(res => {
      setCommunes(res.data);
    }).catch(() => {
      Alert.alert('Erreur', 'Impossible de charger les communes.');
    });
  }, []);

  // Mettre à jour les arrondissements quand la commune change
const onCommuneChange = (id_commune: number) => {
  if (id_commune === 0) {
    setForm(prev => ({ ...prev, id_commune: null, id_arondissement: null }));
    setArrondissements([]);
    return;
  }
  const commune = communes.find(c => c.id_commune === id_commune);
  setForm(prev => ({ ...prev, id_commune, id_arondissement: null }));
  setArrondissements(commune?.arrondissements || []);
};

  const handleRegister = async () => {
    if (!form.nom_user || !form.prenom_user || !form.email || !form.mdp_user || !form.id_commune) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (form.id_commune === 1 && !form.id_arondissement) {
      Alert.alert('Erreur', "L'arrondissement est obligatoire pour Antananarivo.");
      return;
    }

    const body: any = {
      nom_user    : form.nom_user,
      prenom_user : form.prenom_user,
      email       : form.email,
      mdp_user    : form.mdp_user,
      id_commune  : form.id_commune,
    };
    if (form.id_arondissement) {
      body.id_arondissement = form.id_arondissement;
    }

    setLoading(true);
    try {
      const res = await api.post('/accounts/register/', body);
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', res.data.role);
      router.replace('/citoyen/accueil' as any);
    } catch (err: any) {
      Alert.alert('Erreur', JSON.stringify(err.response?.data || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.header}>
          <Text style={styles.titre}>Inscription</Text>
          <Text style={styles.sousTitre}>{"Créez votre compte citoyen"}</Text>
        </View>

        <View style={styles.form}>

          {/* Nom */}
          <Text style={styles.label}>Nom *</Text>
          <TextInput style={styles.input} value={form.nom_user}
            onChangeText={v => setForm(p => ({ ...p, nom_user: v }))}
            autoCapitalize="words" placeholderTextColor="#999" placeholder="Rakoto" />

          {/* Prénom */}
          <Text style={styles.label}>Prénom *</Text>
          <TextInput style={styles.input} value={form.prenom_user}
            onChangeText={v => setForm(p => ({ ...p, prenom_user: v }))}
            autoCapitalize="words" placeholderTextColor="#999" placeholder="Jean" />

          {/* Email */}
          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} value={form.email}
            onChangeText={v => setForm(p => ({ ...p, email: v }))}
            keyboardType="email-address" autoCapitalize="none"
            placeholderTextColor="#999" placeholder="jean@mail.mg" />

          {/* Mot de passe */}
          <Text style={styles.label}>Mot de passe *</Text>
          <TextInput style={styles.input} value={form.mdp_user}
            onChangeText={v => setForm(p => ({ ...p, mdp_user: v }))}
            secureTextEntry placeholderTextColor="#999" placeholder="••••••••" />

          {/* Commune */}
          <Text style={styles.label}>Commune *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
                selectedValue={form.id_commune ?? 0}
                onValueChange={(val: number) => onCommuneChange(val)}
                style={styles.picker}
                >
                <Picker.Item label="-- Choisir une commune --" value={0} />
                {communes.map(c => (
                    <Picker.Item key={c.id_commune} label={c.nom_commune} value={c.id_commune} />
                ))}
                </Picker>
          </View>

          {/* Arrondissement — affiché uniquement si la commune en a */}
          {arrondissements.length > 0 && (
            <>
              <Text style={styles.label}>Arrondissement *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.id_arondissement}
                  onValueChange={val => setForm(p => ({ ...p, id_arondissement: val }))}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Choisir un arrondissement --" value={null} />
                  {arrondissements.map(a => (
                    <Picker.Item
                      key={a.id_arondissement}
                      label={a.nom_arondissement || `Arrondissement ${a.num_arondissement}`}
                      value={a.id_arondissement}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* Bouton */}
          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{"S'inscrire"}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.lien}>{"Déjà un compte ? Se connecter"}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container     : { flex: 1, backgroundColor: '#f0f4f8' },
  header        : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60, marginBottom: 20 },
  titre         : { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  sousTitre     : { fontSize: 13, color: '#aed6f1', marginTop: 4 },
  form          : { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20, elevation: 3 },
  label         : { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 5, marginTop: 10 },
  input         : { borderWidth: 1, borderColor: '#dde1e7', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', backgroundColor: '#f8f9fa' },
  pickerWrapper : { borderWidth: 1, borderColor: '#dde1e7', borderRadius: 10, backgroundColor: '#f8f9fa', marginBottom: 4 },
  picker        : { color: '#2c3e50' },
  btn           : { backgroundColor: '#1a5276', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  btnText       : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  lien          : { textAlign: 'center', color: '#1a5276', marginTop: 16, fontSize: 13 },
});