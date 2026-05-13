import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../../src/config/api';

export default function ActeScreen() {
  const router = useRouter();
  const { id_acte, from_demande, id_demande_origin, id_agent_origin } = useLocalSearchParams();

  const [acte, setActe]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [role, setRole]             = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [emailDest, setEmailDest]   = useState('');
  const [sending, setSending]       = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('role').then(r => setRole(r || ''));
    api.get(`/dashboard/actes/${id_acte}/`).then(res => {
      setActe(res.data);
      if (res.data.email_citoyen) setEmailDest(res.data.email_citoyen);
    }).catch(() => {
      Alert.alert('Erreur', 'Impossible de charger cet acte.');
    }).finally(() => setLoading(false));
  }, []);

  const confirmerActe = () => {
    router.push({
      pathname: '/agent/detail_demande' as any,
      params  : {
        id_demande      : id_demande_origin,
        id_agent        : id_agent_origin,
        id_acte_confirme: acte.id_acte,
      }
    });
  };

  const genererEtVisualiser = async () => {
    if (!acte.id_demande) {
      Alert.alert('Info', 'Aucune demande validée liée à cet acte.');
      return;
    }
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const url   = `http://10.210.105.55:8000/dashboard/demandes/${acte.id_demande}/acte/pdf/`;
      const documentDirectory = (FileSystem as any).documentDirectory ?? '';
      const dest  = documentDirectory + `acte_${acte.num_acte}.pdf`;

      const res = await FileSystem.downloadAsync(
        url, dest,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        await Sharing.shareAsync(res.uri, {
          mimeType   : 'application/pdf',
          dialogTitle: 'Visualiser l\'acte',
        });
        setShowModal(true);
      } else {
        Alert.alert('Erreur', 'Impossible de générer le PDF.');
      }
    } catch (err: any) {
      console.log('ERREUR PDF:', err.message);
      Alert.alert('Erreur', 'Erreur lors de la génération.');
    } finally {
      setGenerating(false);
    }
  };

  const envoyerPDF = async () => {
    if (!emailDest.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un email.');
      return;
    }
    setSending(true);
    try {
      await api.post(`/dashboard/demandes/${acte.id_demande}/envoyer-pdf/`, {
        email: emailDest
      });
      Alert.alert(
        'Succès ✅',
        `PDF envoyé à ${emailDest}. La demande est maintenant terminée.`,
        [{ text: 'OK', onPress: () => { setShowModal(false); router.back(); } }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', JSON.stringify(err.response?.data || 'Erreur envoi'));
    } finally {
      setSending(false);
    }
  };

  const labelRole = (role: string) => {
    const labels: any = {
      'pere'        : 'Père',
      'mere'        : 'Mère',
      'enfant'      : 'Enfant',
      'temoin'      : 'Témoin',
      'temoin2'     : 'Témoin 2',
      'epoux1'      : 'Époux',
      'epoux2'      : 'Épouse',
      'pere_epoux1' : 'Père de l\'époux',
      'mere_epoux1' : 'Mère de l\'époux',
      'pere_epoux2' : 'Père de l\'épouse',
      'mere_epoux2' : 'Mère de l\'épouse',
      'defunt'      : 'Défunt(e)',
      'pere_defunt' : 'Père du défunt',
      'mere_defunt' : 'Mère du défunt',
    };
    return labels[role] || role;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a5276" />
    </View>
  );

  if (!acte) return (
    <View style={styles.center}>
      <Text>Acte introuvable.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Acte original</Text>
        <Text style={styles.numActe}>{acte.num_acte}</Text>
      </View>

      {/* Informations générales */}
      <View style={styles.card}>
        <Text style={styles.cardTitre}>Informations générales</Text>
        <Ligne label="Numéro"    valeur={acte.num_acte} />
        <Ligne label="Type"      valeur={acte.type_acte} />
        <Ligne label="Date acte" valeur={acte.date_acte} />
      </View>

      {/* Personnes concernées */}
      {acte.personnes && acte.personnes.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Personnes concernées</Text>
          {acte.personnes.map((p: any, i: number) => (
            <View key={i} style={styles.personne}>
              <Text style={styles.personneRole}>{labelRole(p.role)}</Text>
              <Text style={styles.personneNom}>
                {p.prenom_personne} {p.nom_personne}
              </Text>
              <Text style={styles.personneInfo}>
                Né(e) le : {p.date_naissance?.split(' ')[0]} à {p.lieu_naiss}
              </Text>
              <Text style={styles.personneInfo}>
                Sexe : {p.sexe === 'M' ? 'Masculin' : 'Féminin'} — {p.profession}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Demande liée */}
      {acte.id_demande && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Demande liée</Text>
          <Ligne label="Statut" valeur={acte.statut_demande || 'N/A'} />
          {acte.email_citoyen && (
            <Ligne label="Email citoyen" valeur={acte.email_citoyen} />
          )}
        </View>
      )}

      {/* ── Bouton confirmer — visible si on vient de detail.tsx ── */}
      {from_demande === 'true' && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>{"Vérification de l'acte"}</Text>
          <Text style={styles.verifInfo}>
            Vérifiez que cet acte correspond bien à la demande avant de confirmer.
          </Text>
          <TouchableOpacity
            style={styles.btnConfirmer}
            onPress={confirmerActe}
          >
            <Text style={styles.btnConfirmerText}>{"✅ C'est le bon acte — Confirmer"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPasLeBon}
            onPress={() => router.back()}
          >
            <Text style={styles.btnPasLeBonText}>{"✕ Ce n'est pas le bon acte"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bouton générer PDF — si accès direct sans from_demande ── */}
      {!from_demande && role?.toLowerCase() === 'agent' &&
       acte.statut_demande === 'VALIDER' && acte.paiement_ok === true && (
        <View style={[styles.card, { marginHorizontal: 12 }]}>
          <Text style={styles.cardTitre}>{"Délivrance de l'acte"}</Text>
          <TouchableOpacity
            style={styles.btnPDF}
            onPress={genererEtVisualiser}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPDFText}>📄 Générer et visualiser le PDF</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {!from_demande && role?.toLowerCase() === 'agent' &&
       acte.statut_demande === 'VALIDER' && acte.paiement_ok === false && (
        <View style={[styles.card, { marginHorizontal: 12, backgroundColor: '#fef9e7' }]}>
          <Text style={{ color: '#e67e22', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}>
            ⚠️ Paiement non confirmé — impossible de générer le PDF
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Modal envoi email */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitre}>{"📧 Envoyer l'acte"}</Text>
            <Text style={styles.modalSubTitre}>
              Le PDF sera envoyé par email au destinataire.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={emailDest}
              onChangeText={setEmailDest}
              placeholder="Email du destinataire"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.btnEnvoyer}
              onPress={envoyerPDF}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnEnvoyerText}>📤 Envoyer</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnAnnuler}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.btnAnnulerText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

function Ligne({ label, valeur }: { label: string, valeur: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <Text style={styles.ligneValeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#f0f4f8' },
  center         : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header         : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour         : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre          : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  numActe        : { fontSize: 14, color: '#aed6f1', marginTop: 4 },
  card           : { backgroundColor: '#fff', margin: 12, marginBottom: 6, borderRadius: 12, padding: 16, elevation: 3 },
  cardTitre      : { fontSize: 15, fontWeight: 'bold', color: '#1a5276', marginBottom: 12 },
  ligne          : { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ligneLabel     : { fontSize: 13, color: '#7f8c8d', flex: 1 },
  ligneValeur    : { fontSize: 13, color: '#2c3e50', fontWeight: '600', flex: 1, textAlign: 'right' },
  personne       : { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 8 },
  personneRole   : { fontSize: 11, color: '#8e44ad', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  personneNom    : { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  personneInfo   : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  verifInfo      : { fontSize: 13, color: '#7f8c8d', marginBottom: 12, textAlign: 'center' },
  btnConfirmer   : { backgroundColor: '#27ae60', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnConfirmerText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnPasLeBon    : { alignItems: 'center', padding: 8 },
  btnPasLeBonText: { color: '#e74c3c', fontSize: 13 },
  btnPDF         : { backgroundColor: '#8e44ad', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  btnPDFText     : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay   : { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitre     : { fontSize: 20, fontWeight: 'bold', color: '#1a5276', marginBottom: 8 },
  modalSubTitre  : { fontSize: 13, color: '#7f8c8d', marginBottom: 16 },
  modalInput     : { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', marginBottom: 16 },
  btnEnvoyer     : { backgroundColor: '#1a5276', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnEnvoyerText : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnAnnuler     : { alignItems: 'center', padding: 10 },
  btnAnnulerText : { color: '#e74c3c', fontSize: 14 },
});