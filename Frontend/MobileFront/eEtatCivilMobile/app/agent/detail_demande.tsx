import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function DetailDemandeScreen() {
  const router = useRouter();
  const { id_demande, id_agent, id_acte_confirme } = useLocalSearchParams();

  const [demande, setDemande]           = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [motif, setMotif]               = useState('');
  const [action, setAction]             = useState<'VALIDER' | 'REFUSER' | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [emailDest, setEmailDest]       = useState('');
  const [sending, setSending]           = useState(false);

  // Recherche acte
  const [queryActe, setQueryActe]         = useState('');
  const [suggestions, setSuggestions]     = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Acte confirmé
  const [acteConfirme, setActeConfirme] = useState<any>(null);

  useEffect(() => {
    // Charger la demande
    api.get(`/dashboard/demandes/${id_demande}/`).then(res => {
      setDemande(res.data);
      if (res.data.num_acte) setQueryActe(res.data.num_acte);
    }).catch(() => {
      Alert.alert('Erreur', 'Impossible de charger la demande.');
    }).finally(() => setLoading(false));
  }, []);

  // Charger l'acte confirmé si on revient de acte.tsx
useEffect(() => {
  if (id_acte_confirme) {
    api.get(`/dashboard/actes/${id_acte_confirme}/?id_demande=${id_demande}`).then(res => {
      setActeConfirme(res.data);
      if (res.data.email_citoyen) setEmailDest(res.data.email_citoyen);
    }).catch(() => {});
  }
}, [id_acte_confirme]);

  const chercherActe = async (text: string) => {
    setQueryActe(text);
    if (text.length < 2) { setSuggestions([]); return; }
    setLoadingSearch(true);
    try {
      const res = await api.get(`/dashboard/recherche/suggestions/?q=${text}`);
      setSuggestions(res.data);
    } catch {} finally {
      setLoadingSearch(false);
    }
  };

  const selectionnerActe = (id_acte: number) => {
    setSuggestions([]);
    // Naviguer vers acte.tsx avec paramètres de retour
    router.push({
      pathname: '/agent/acte' as any,
      params  : {
        id_acte          : id_acte,
        from_demande     : 'true',
        id_demande_origin: id_demande,
        id_agent_origin  : id_agent,
      }
    });
  };

  const genererEtVisualiser = async () => {
    if (!acteConfirme?.id_demande) {
      Alert.alert('Info', 'Aucune demande validée liée à cet acte.');
      return;
    }
    setGenerating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const url   = `http://10.210.105.55:8000/dashboard/demandes/${acteConfirme.id_demande}/acte/pdf/`;
      const documentDirectory = (FileSystem as any).documentDirectory ?? '';
      const dest  = documentDirectory + `acte_${acteConfirme.num_acte}.pdf`;

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
      await api.post(`/dashboard/demandes/${acteConfirme.id_demande}/envoyer-pdf/`, {
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

  const handleAction = async () => {
    if (!action) return;
    if (action === 'REFUSER' && !motif) {
      Alert.alert('Erreur', 'Le motif est obligatoire pour un refus.');
      return;
    }

    Alert.alert(
      action === 'VALIDER' ? 'Confirmer validation' : 'Confirmer refus',
      `Voulez-vous vraiment ${action === 'VALIDER' ? 'valider' : 'refuser'} cette demande ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text  : 'Confirmer',
          style : action === 'REFUSER' ? 'destructive' : 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.patch(
                `/dashboard/demandes/${id_agent}/${id_demande}/`,
                { action, motif: motif || '' }
              );
              Alert.alert(
                'Succès ✅',
                `Demande ${action === 'VALIDER' ? 'validée' : 'refusée'} avec succès.`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert('Erreur', JSON.stringify(err.response?.data || 'Erreur'));
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1a5276" />
    </View>
  );

  if (!demande) return (
    <View style={styles.center}>
      <Text>Demande introuvable.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>

      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Détail demande</Text>
        <Text style={styles.numDemande}>{demande.num_demande}</Text>
      </View>

      {/* Informations demande */}
      <View style={styles.card}>
        <Text style={styles.cardTitre}>Informations</Text>
        <Ligne label="Type d'acte"    valeur={demande.type_acte} />
        <Ligne label="Statut"         valeur={demande.statut_demande} />
        <Ligne label="Date dépôt"     valeur={demande.date_depot} />
        <Ligne label="Commune"        valeur={demande.commune} />
        <Ligne label="Arrondissement" valeur={demande.arrondissement || 'N/A'} />
        <Ligne label="Citoyen"        valeur={demande.citoyen} />
        <Ligne label="N° acte"        valeur={demande.num_acte} />
      </View>

      {/* Personnes */}
      {demande.personnes && demande.personnes.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Personnes concernées</Text>
          {demande.personnes.map((dp: any, i: number) => (
            <View key={i} style={styles.personne}>
              <Text style={styles.personneRole}>{dp.role}</Text>
              <Text style={styles.personneNom}>
                {dp.personne.prenom_personne} {dp.personne.nom_personne}
              </Text>
              <Text style={styles.personneInfo}>
                Né(e) le : {dp.personne.date_naissance?.split('T')[0]} à {dp.personne.lieu_naiss}
              </Text>
              <Text style={styles.personneInfo}>
                Profession : {dp.personne.profession}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Photo CIN */}
      {demande.photo_cin && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Photo CIN</Text>
          <Image
            source={{ uri: demande.photo_cin }}
            style={{ width: '100%', height: 200, borderRadius: 8 }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* ── Recherche acte dans les archives ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitre}>{"🔍 Rechercher l'acte dans les archives"}</Text>
        <Text style={styles.searchInfo}>
          N° acte demandé : <Text style={styles.numActeHighlight}>{demande.num_acte}</Text>
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={queryActe}
            onChangeText={chercherActe}
            placeholder="Rechercher par num_acte, nom..."
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
          {loadingSearch && (
            <ActivityIndicator size="small" color="#1a5276" style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestion}
                onPress={() => selectionnerActe(s.id_acte)}
              >
                <Text style={styles.suggestionNum}>📄 {s.num_acte}</Text>
                <Text style={styles.suggestionNoms}>
                  {s.personnes?.join(' • ') || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {suggestions.length === 0 && queryActe.length >= 2 && !loadingSearch && (
          <Text style={styles.videSearch}>Aucun acte trouvé pour : {queryActe}</Text>
        )}
      </View>

      {/* ── Acte confirmé ── */}
      {acteConfirme && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>✅ Acte original confirmé</Text>
          <View style={styles.acteFound}>
            <Text style={styles.acteFoundNum}>{acteConfirme.num_acte}</Text>
            <Text style={styles.acteFoundType}>{acteConfirme.type_acte}</Text>
            {acteConfirme.personnes?.map((p: any, i: number) => (
              <Text key={i} style={styles.acteFoundPersonne}>
                {p.role} : {p.prenom_personne} {p.nom_personne}
              </Text>
            ))}
          </View>

          {/* Bouton changer d'acte */}
          <TouchableOpacity
            style={styles.btnChangerActe}
            onPress={() => setActeConfirme(null)}
          >
            <Text style={styles.btnChangerActeText}>{"✕ Changer d'acte"}</Text>
          </TouchableOpacity>

          {/* Bouton PDF si VALIDER */}
          {demande.statut_demande === 'VALIDER' && (
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
          )}

          {/* Message si pas encore validée */}
          {demande.statut_demande === 'EN ATTENTE' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                {"ℹ️ Validez d'abord la demande pour pouvoir générer le PDF."}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Actions — uniquement si EN ATTENTE */}
      {demande.statut_demande === 'EN ATTENTE' && (
        <View style={styles.card}>
          <Text style={styles.cardTitre}>Action</Text>

          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={[styles.actionBtn, action === 'VALIDER' && styles.actionBtnValiderActive]}
              onPress={() => setAction('VALIDER')}
            >
              <Text style={[styles.actionBtnText, action === 'VALIDER' && styles.actionBtnTextActive]}>
                ✅ Valider
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, action === 'REFUSER' && styles.actionBtnRefuserActive]}
              onPress={() => setAction('REFUSER')}
            >
              <Text style={[styles.actionBtnText, action === 'REFUSER' && styles.actionBtnTextActive]}>
                ❌ Refuser
              </Text>
            </TouchableOpacity>
          </View>

          {action === 'REFUSER' && (
            <>
              <Text style={styles.label}>Motif du refus *</Text>
              <TextInput
                style={styles.input}
                value={motif}
                onChangeText={setMotif}
                placeholder="Expliquez la raison du refus..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {action && (
            <TouchableOpacity
              style={[styles.btnConfirmer, action === 'REFUSER' && styles.btnRefuser]}
              onPress={handleAction}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnConfirmerText}>
                    {action === 'VALIDER' ? 'Confirmer la validation' : 'Confirmer le refus'}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Demande déjà traitée */}
      {demande.statut_demande !== 'EN ATTENTE' && (
        <View style={[styles.card, styles.cardTraitee]}>
          <Text style={styles.traiteeText}>
            Cette demande a déjà été traitée — statut : {demande.statut_demande}
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
  container             : { flex: 1, backgroundColor: '#f0f4f8' },
  center                : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header                : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour                : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre                 : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  numDemande            : { fontSize: 14, color: '#aed6f1', marginTop: 4 },
  card                  : { backgroundColor: '#fff', margin: 12, marginBottom: 6, borderRadius: 12, padding: 16, elevation: 3 },
  cardTitre             : { fontSize: 15, fontWeight: 'bold', color: '#1a5276', marginBottom: 12 },
  ligne                 : { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ligneLabel            : { fontSize: 13, color: '#7f8c8d', flex: 1 },
  ligneValeur           : { fontSize: 13, color: '#2c3e50', fontWeight: '600', flex: 1, textAlign: 'right' },
  personne              : { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 8 },
  personneRole          : { fontSize: 11, color: '#1a5276', fontWeight: 'bold', marginBottom: 4 },
  personneNom           : { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  personneInfo          : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  searchInfo            : { fontSize: 13, color: '#7f8c8d', marginBottom: 10 },
  numActeHighlight      : { color: '#1a5276', fontWeight: 'bold' },
  searchRow             : { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  searchInput           : { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, fontSize: 14, color: '#2c3e50', backgroundColor: '#f8f9fa' },
  suggestions           : { backgroundColor: '#f8f9fa', borderRadius: 10, overflow: 'hidden' },
  suggestion            : { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionNum         : { fontSize: 13, fontWeight: 'bold', color: '#1a5276' },
  suggestionNoms        : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  videSearch            : { fontSize: 13, color: '#e74c3c', marginTop: 4, textAlign: 'center' },
  acteFound             : { backgroundColor: '#eafaf1', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#27ae60', marginBottom: 10 },
  acteFoundNum          : { fontSize: 15, fontWeight: 'bold', color: '#1a5276' },
  acteFoundType         : { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  acteFoundPersonne     : { fontSize: 12, color: '#2c3e50', marginTop: 2 },
  btnChangerActe        : { alignItems: 'center', marginBottom: 8 },
  btnChangerActeText    : { color: '#e74c3c', fontSize: 13 },
  btnPDF                : { backgroundColor: '#8e44ad', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  btnPDFText            : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  infoBox               : { backgroundColor: '#fef9e7', borderRadius: 8, padding: 10, marginTop: 8 },
  infoBoxText           : { fontSize: 13, color: '#e67e22', textAlign: 'center' },
  actionBtns            : { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn             : { flex: 1, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#dde1e7', alignItems: 'center' },
  actionBtnValiderActive: { borderColor: '#27ae60', backgroundColor: '#eafaf1' },
  actionBtnRefuserActive: { borderColor: '#e74c3c', backgroundColor: '#fdf2f2' },
  actionBtnText         : { fontSize: 14, color: '#7f8c8d', fontWeight: '600' },
  actionBtnTextActive   : { color: '#2c3e50' },
  label                 : { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 6 },
  input                 : { borderWidth: 1, borderColor: '#dde1e7', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', backgroundColor: '#f8f9fa', textAlignVertical: 'top' },
  btnConfirmer          : { backgroundColor: '#27ae60', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  btnRefuser            : { backgroundColor: '#e74c3c' },
  btnConfirmerText      : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cardTraitee           : { backgroundColor: '#f8f9fa' },
  traiteeText           : { fontSize: 14, color: '#7f8c8d', textAlign: 'center', fontStyle: 'italic' },
  modalOverlay          : { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer        : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitre            : { fontSize: 20, fontWeight: 'bold', color: '#1a5276', marginBottom: 8 },
  modalSubTitre         : { fontSize: 13, color: '#7f8c8d', marginBottom: 16 },
  modalInput            : { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', marginBottom: 16 },
  btnEnvoyer            : { backgroundColor: '#1a5276', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnEnvoyerText        : { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnAnnuler            : { alignItems: 'center', padding: 10 },
  btnAnnulerText        : { color: '#e74c3c', fontSize: 14 },
});