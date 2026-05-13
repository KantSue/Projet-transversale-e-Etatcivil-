import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';

const TYPES_ACTES = [
  { id: 1, label: 'Acte de naissance' },
  { id: 2, label: 'Acte de décès' },
  { id: 3, label: 'Acte de mariage' },
];

export default function DemandeScreen() {
  const router = useRouter();

  // Navigation étapes
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  // Étape 1
  const [typeActe, setTypeActe] = useState(1);

  // Étape 2
  const [numActe, setNumActe] = useState('');
  const [photo, setPhoto]     = useState<any>(null);

  // Communes / Arrondissements
  const [communes, setCommunes]                       = useState<any[]>([]);
  const [arrondissements, setArrondissements]         = useState<any[]>([]);
  const [communeSelectionnee, setCommuneSelectionnee] = useState<number>(0);
  const [arrondissementSelectionne, setArrondissementSelectionne] = useState<number>(0);

  // Personnes
  const [enfant, setEnfant] = useState({ nom: '', prenom: '', date_naissance: '', lieu_naiss: '', sexe: 'F', profession: '' });
  const [pere,   setPere]   = useState({ nom: '', prenom: '', date_naissance: '', lieu_naiss: '', sexe: 'M', profession: '' });
  const [mere,   setMere]   = useState({ nom: '', prenom: '', date_naissance: '', lieu_naiss: '', sexe: 'F', profession: '' });
  const [defunt, setDefunt] = useState({ nom: '', prenom: '', date_naissance: '', lieu_naiss: '', sexe: 'M', profession: '' });
  const [epoux1, setEpoux1] = useState({ nom: '', prenom: '', date_naissance: '', lieu_naiss: '', sexe: 'M', profession: '' });
  const [epoux2, setEpoux2] = useState({ nom: '', prenom: '', date_naissance: '', lieu_naiss: '', sexe: 'F', profession: '' });

  // Étape 3
  const [tel, setTel] = useState('');
  const [nbExemplaires, setNbExemplaires] = useState(1);
  const montant = nbExemplaires * 1000;
  useEffect(() => {
    api.get('/accounts/communes/').then(res => {
      setCommunes(res.data);
    }).catch(() => {
      Alert.alert('Erreur', 'Impossible de charger les communes.');
    });
  }, []);

  const onCommuneChange = (id: number) => {
    setCommuneSelectionnee(id);
    setArrondissementSelectionne(0);
    const c = communes.find(c => c.id_commune === id);
    setArrondissements(c?.arrondissements || []);
  };
// redirection si commune non disponnible ou arrondissemnt indisponible
  const [dijkstraResult, setDijkstraResult] = useState<any>(null);
  const [checkingDispo, setCheckingDispo]   = useState(false);

  // Modifiez onArrondissementChange
  const onArrondissementChange = async (id: number) => {
    setArrondissementSelectionne(id);
    setDijkstraResult(null);
    if (!id) return;

    setCheckingDispo(true);
    try {
      const res = await api.get(`/dashboard/arrondissements/${id}/verifier/`);
      setDijkstraResult(res.data);
    } catch {} finally {
      setCheckingDispo(false);
    }
  };
  const choisirPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const validerEtape2 = () => {
    if (!numActe) {
      Alert.alert('Erreur', "Le numéro d'acte est obligatoire.");
      return;
    }
    if (!photo) {
      Alert.alert('Erreur', "La photo de la carte d'identité est obligatoire.");
      return;
    }
    if (!communeSelectionnee) {
      Alert.alert('Erreur', 'Veuillez sélectionner une commune.');
      return;
    }
    if (arrondissements.length > 0 && !arrondissementSelectionne) {
      Alert.alert('Erreur', 'Veuillez sélectionner un arrondissement.');
      return;
    }
    if (typeActe === 1) {
      if (!enfant.nom || !enfant.prenom || !enfant.date_naissance || !enfant.lieu_naiss) {
        Alert.alert('Erreur', "Remplissez toutes les informations de l'enfant.");
        return;
      }
      if (!pere.nom || !pere.prenom || !mere.nom || !mere.prenom) {
        Alert.alert('Erreur', 'Remplissez les informations du père et de la mère.');
        return;
      }
    } else if (typeActe === 2) {
      if (!defunt.nom || !defunt.prenom || !defunt.date_naissance) {
        Alert.alert('Erreur', 'Remplissez les informations du défunt.');
        return;
      }
    } else if (typeActe === 3) {
      if (!epoux1.nom || !epoux1.prenom || !epoux2.nom || !epoux2.prenom) {
        Alert.alert('Erreur', 'Remplissez les informations des deux époux.');
        return;
      }
    }
    setStep(3);
  };

  const buildPersonne = (p: any) => ({
    nom_personne    : p.nom,
    prenom_personne : p.prenom,
    date_naissance  : p.date_naissance + ' 00:00:00',
    lieu_naiss      : p.lieu_naiss,
    sexe            : p.sexe || 'M',
    profession      : p.profession || 'N/A',
  });

  const handleSoumettre = async () => {
    if (!tel) {
      Alert.alert('Erreur', 'Entrez votre numéro de téléphone.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('numero_tel',   tel);
      formData.append('id_type_acte', String(typeActe));
      formData.append('num_acte',     numActe);
      formData.append('id_commune',   String(communeSelectionnee));
      formData.append('nb_exemplaires', String(nbExemplaires));

      if (arrondissementSelectionne) {
        formData.append('id_arrondissement', String(arrondissementSelectionne));
      }

      // Photo CIN
      formData.append('photo_ci', {
        uri  : photo.uri,
        name : `cin_${Date.now()}.jpg`,
        type : 'image/jpeg',
      } as any);

      // Personnes
      if (typeActe === 1) {
        formData.append('enfant', JSON.stringify(buildPersonne(enfant)));
        formData.append('pere',   JSON.stringify(buildPersonne({ ...pere,  sexe: 'M' })));
        formData.append('mere',   JSON.stringify(buildPersonne({ ...mere,  sexe: 'F' })));
      } else if (typeActe === 2) {
        formData.append('defunt', JSON.stringify(buildPersonne(defunt)));
      } else if (typeActe === 3) {
        formData.append('epoux1', JSON.stringify(buildPersonne(epoux1)));
        formData.append('epoux2', JSON.stringify(buildPersonne(epoux2)));
      }

      await api.post('/dashboard/paiements/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Succès ✅', 'Votre demande a été soumise avec succès !', [
        { text: 'OK', onPress: () => router.replace('/citoyen/acceuil' as any) }
      ]);
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

        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.retour}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.titre}>Nouvelle demande</Text>
          <View style={styles.steps}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ÉTAPE 1 — Type d'acte */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.stepTitre}>{"Étape 1 — Type d'acte"}</Text>
            <Text style={styles.label}>{"Sélectionnez le type d'acte"}</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={typeActe}
                onValueChange={(v: number) => setTypeActe(v)}
                style={styles.picker}
              >
                {TYPES_ACTES.map(t => (
                  <Picker.Item key={t.id} label={t.label} value={t.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Suivant →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ÉTAPE 2 — Informations */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.stepTitre}>Étape 2 — Informations</Text>

            {/* Numéro d'acte */}
            <Text style={styles.label}>{"Numéro d'acte *"}</Text>
            <TextInput
              style={styles.input}
              value={numActe}
              onChangeText={setNumActe}
              placeholder="Ex: NAISS-2024-001"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            <Text style={styles.hint}>Inscrit sur votre livret de famille</Text>

            {/* Photo CIN */}
            <Text style={styles.label}>{"Photo carte d'identité (recto-verso) *"}</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={choisirPhoto}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoBtnText}>📷 Choisir depuis la galerie</Text>
              )}
            </TouchableOpacity>

            {/* Commune */}
            <Text style={styles.label}>Commune *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={communeSelectionnee}
                onValueChange={(v: number) => onCommuneChange(v)}
                style={styles.picker}
              >
                <Picker.Item label="-- Choisir une commune --" value={0} />
                {communes.map(c => (
                  <Picker.Item key={c.id_commune} label={c.nom_commune} value={c.id_commune} />
                ))}
              </Picker>
            </View>

            {/* Arrondissement */}
            {arrondissements.length > 0 && (
  <>
    <Text style={styles.label}>Arrondissement *</Text>
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={arrondissementSelectionne}
        onValueChange={(v: number) => onArrondissementChange(v)}
        style={styles.picker}
      >
        <Picker.Item label="-- Choisir un arrondissement --" value={0} />
        {arrondissements.map(a => (
          <Picker.Item
            key={a.id_arondissement}
            label={a.nom_arondissement || `Arrondissement ${a.num_arondissement}`}
            value={a.id_arondissement}
          />
        ))}
      </Picker>
    </View>

    {/* Vérification Dijkstra */}
    {checkingDispo && (
      <ActivityIndicator size="small" color="#1a5276" style={{ marginBottom: 8 }} />
    )}

    {dijkstraResult && arrondissementSelectionne > 0 && (
      <View style={[
        styles.dijkstraBox,
        { borderColor: dijkstraResult.statut === 'disponible' ? '#27ae60' : '#e74c3c' }
      ]}>
        {dijkstraResult && arrondissementSelectionne > 0 && (
  <View style={[
    styles.dijkstraBox,
    { borderColor: dijkstraResult.disponible ? '#27ae60' : '#e74c3c' }
  ]}>
    {dijkstraResult.disponible ? (
      <Text style={styles.dijkstraDispo}>
        ✅ {dijkstraResult.message}
      </Text>
    ) : (
      <>
        <Text style={styles.dijkstraIndispo}>
          ❌ {dijkstraResult.message}
        </Text>
        {dijkstraResult.redirection ? (
          <>
            <Text style={styles.dijkstraAlt}>
              📍 Alternative la plus proche :
            </Text>
            <Text style={styles.dijkstraAltNom}>
              {dijkstraResult.redirection.arrondissement}
            </Text>
            <Text style={styles.dijkstraAltCommune}>
              {dijkstraResult.redirection.commune}
            </Text>
            <Text style={styles.dijkstraAltDist}>
              Distance : {dijkstraResult.redirection.distance_km} km
            </Text>
            <TouchableOpacity
              style={styles.btnRediriger}
              onPress={() => {
                // Trouver l'id de l'arrondissement alternatif
                const alt = arrondissements.find(
                  (a: any) => a.nom_arondissement === dijkstraResult.redirection.arrondissement
                );
                if (alt) {
                  setArrondissementSelectionne(alt.id_arondissement);
                  setDijkstraResult(null);
                } else {
                  Alert.alert('Info', `Veuillez sélectionner manuellement : ${dijkstraResult.redirection.arrondissement}`);
                }
              }}
            >
              <Text style={styles.btnRedigirerText}>
                ✅ Utiliser {dijkstraResult.redirection.arrondissement}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.dijkstraAucun}>
            {dijkstraResult.message}
          </Text>
        )}
      </>
    )}
  </View>
)}
      </View>
    )}
  </>
)}
            {/* Personnes selon type */}
            {typeActe === 1 && (
              <>
                <SectionPersonne titre="Enfant" data={enfant} onChange={setEnfant} showSexe />
                <SectionPersonne titre="Père"   data={pere}   onChange={setPere} />
                <SectionPersonne titre="Mère"   data={mere}   onChange={setMere} />
              </>
            )}
            {typeActe === 2 && (
              <SectionPersonne titre="Défunt" data={defunt} onChange={setDefunt} showSexe />
            )}
            {typeActe === 3 && (
              <>
                <SectionPersonne titre="Époux 1" data={epoux1} onChange={setEpoux1} showSexe />
                <SectionPersonne titre="Époux 2" data={epoux2} onChange={setEpoux2} showSexe />
              </>
            )}

            <TouchableOpacity style={styles.btn} onPress={validerEtape2}>
              <Text style={styles.btnText}>Suivant →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.lien}>← Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ÉTAPE 3 — Paiement */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.stepTitre}>Étape 3 — Paiement</Text>

            <View style={styles.paiementInfo}>
              <Text style={styles.montant}>1 000 Ar</Text>
              <Text style={styles.montantLabel}>Frais de demande</Text>
            </View>

            {/* Résumé */}
            <View style={styles.resume}>
              <Text style={styles.resumeText}>
                Type : {TYPES_ACTES.find(t => t.id === typeActe)?.label}
              </Text>
              <Text style={styles.resumeText}>
                {"N° acte : "}{numActe}
              </Text>
              <Text style={styles.resumeText}>
                Commune : {communes.find(c => c.id_commune === communeSelectionnee)?.nom_commune}
              </Text>
              {arrondissementSelectionne > 0 && (
                <Text style={styles.resumeText}>
                  Arrondissement : {arrondissements.find(a => a.id_arondissement === arrondissementSelectionne)?.nom_arondissement}
                </Text>
              )}
              <Text style={styles.resumeText}>Photo CIN : ✅ jointe</Text>
            </View>
            {/* Nombre d'exemplaires */}
              <Text style={styles.label}>{"Nombre d'exemplaires *"}</Text>
              <View style={styles.exemplairesRow}>
                <TouchableOpacity
                  style={styles.btnMoins}
                  onPress={() => setNbExemplaires(Math.max(1, nbExemplaires - 1))}
                >
                  <Text style={styles.btnMoinsText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.nbExemplaires}>{nbExemplaires}</Text>
                <TouchableOpacity
                  style={styles.btnPlus}
                  onPress={() => setNbExemplaires(Math.min(10, nbExemplaires + 1))}
                >
                  <Text style={styles.btnPlusText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Montant dynamique */}
              <View style={styles.paiementInfo}>
                <Text style={styles.montant}>{montant.toLocaleString()} Ar</Text>
                <Text style={styles.montantLabel}>
                  {nbExemplaires} exemplaire{nbExemplaires > 1 ? 's' : ''} × 1 000 Ar
                </Text>
              </View>

            <Text style={styles.label}>Numéro téléphone MVola *</Text>
            <TextInput
              style={styles.input}
              value={tel}
              onChangeText={setTel}
              keyboardType="phone-pad"
              placeholder="034XXXXXXX"
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.btn} onPress={handleSoumettre} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Payer et soumettre</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(2)}>
              <Text style={styles.lien}>← Retour</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionPersonne({ titre, data, onChange, showSexe }: any) {
  const update = (key: string, val: string) =>
    onChange((p: any) => ({ ...p, [key]: val }));
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitre}>{titre}</Text>
      <TextInput style={styles.input} placeholder="Nom"
        placeholderTextColor="#999" value={data.nom}
        onChangeText={(v: string) => update('nom', v)} />
      <TextInput style={styles.input} placeholder="Prénom"
        placeholderTextColor="#999" value={data.prenom}
        onChangeText={(v: string) => update('prenom', v)} />
      <TextInput style={styles.input} placeholder="Date naissance (YYYY-MM-DD)"
        placeholderTextColor="#999" value={data.date_naissance}
        onChangeText={(v: string) => update('date_naissance', v)} />
      <TextInput style={styles.input} placeholder="Lieu de naissance"
        placeholderTextColor="#999" value={data.lieu_naiss}
        onChangeText={(v: string) => update('lieu_naiss', v)} />
      <TextInput style={styles.input} placeholder="Profession"
        placeholderTextColor="#999" value={data.profession}
        onChangeText={(v: string) => update('profession', v)} />
      {showSexe && (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={data.sexe}
            onValueChange={(v: string) => update('sexe', v)}
            style={styles.picker}
          >
            <Picker.Item label="Masculin" value="M" />
            <Picker.Item label="Féminin"  value="F" />
          </Picker>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#f0f4f8' },
  header         : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour         : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre          : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  steps          : { flexDirection: 'row', marginTop: 16, gap: 8 },
  stepDot        : { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive  : { backgroundColor: '#fff' },
  stepNum        : { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },
  stepNumActive  : { color: '#1a5276' },
  card           : { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 3 },
  stepTitre      : { fontSize: 16, fontWeight: 'bold', color: '#1a5276', marginBottom: 16 },
  label          : { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 6, marginTop: 10 },
  input          : { borderWidth: 1, borderColor: '#dde1e7', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', backgroundColor: '#f8f9fa', marginBottom: 6 },
  hint           : { fontSize: 11, color: '#95a5a6', marginBottom: 10 },
  pickerWrapper  : { borderWidth: 1, borderColor: '#dde1e7', borderRadius: 10, backgroundColor: '#f8f9fa', marginBottom: 10 },
  picker         : { color: '#2c3e50' },
  photoBtn       : { borderWidth: 2, borderColor: '#1a5276', borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 10, backgroundColor: '#eaf4fb' },
  photoBtnText   : { color: '#1a5276', fontSize: 14, fontWeight: '600' },
  photoPreview   : { width: '100%', height: 150, borderRadius: 8 },
  btn            : { backgroundColor: '#1a5276', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  btnText        : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  lien           : { textAlign: 'center', color: '#1a5276', marginTop: 12, fontSize: 13 },
  paiementInfo   : { alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: '#eaf4fb', borderRadius: 12 },
  montant        : { fontSize: 36, fontWeight: 'bold', color: '#1a5276' },
  montantLabel   : { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
  resume         : { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 16 },
  resumeText     : { fontSize: 13, color: '#2c3e50', marginBottom: 4 },
  section        : { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 8 },
  sectionTitre   : { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  dijkstraBox    : { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  dijkstraDispo  : { color: '#27ae60', fontWeight: 'bold', fontSize: 13 },
  dijkstraIndispo: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  dijkstraAlt    : { color: '#2c3e50', fontSize: 13, marginTop: 4 },
  dijkstraAltNom : { color: '#1a5276', fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  dijkstraAltDist: { color: '#7f8c8d', fontSize: 12, marginTop: 2 },
  btnRediriger   : { backgroundColor: '#1a5276', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  btnRedigirerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  dijkstraAucun  : { color: '#e74c3c', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  dijkstraAltCommune: { color: '#7f8c8d', fontSize: 12, marginTop: 2 },
  exemplairesRow : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16, marginTop: 8 },
  btnMoins       : { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center' },
  btnMoinsText   : { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  btnPlus        : { width: 40, height: 40, borderRadius: 20, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  btnPlusText    : { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  nbExemplaires  : { fontSize: 28, fontWeight: 'bold', color: '#1a5276', minWidth: 40, textAlign: 'center' },

});