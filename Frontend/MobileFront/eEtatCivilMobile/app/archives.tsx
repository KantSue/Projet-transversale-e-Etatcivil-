import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/config/api';

export default function ArchivesScreen() {
  const router = useRouter();
  const [query, setQuery]             = useState('');
  const [actes, setActes]             = useState<any[]>([]);
  const [types, setTypes]             = useState<any[]>([]);
  const [filtreType, setFiltreType]   = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { chargerActes(); }, [filtreType]);

  const chargerActes = async () => {
    setLoading(true);
    try {
      const url = filtreType
        ? `/dashboard/actes/?type=${filtreType}`
        : '/dashboard/actes/';
      const res = await api.get(url);
      setActes(res.data.actes);
      setTypes(res.data.types);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les archives.');
    } finally {
      setLoading(false);
    }
  };

  const chercherSuggestions = async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setSuggestions([]); return; }
    try {
      const res = await api.get(`/dashboard/recherche/suggestions/?q=${text}`);
      setSuggestions(res.data);
    } catch {}
  };

  const chercher = async () => {
    if (!query.trim()) { chargerActes(); return; }
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await api.get(`/dashboard/recherche/?q=${query}`);
      setActes(res.data.resultats || res.data);
    } catch {
      Alert.alert('Erreur', 'Recherche impossible.');
    } finally {
      setLoading(false);
    }
  };

  const allerVersActe = (id_acte: number) => {
    setSuggestions([]);
    router.push({
      pathname: '/agent/acte' as any,
      params: { id_acte }
    });
  };

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Archives</Text>
        <Text style={styles.sousTitre}>{actes.length} actes</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={chercherSuggestions}
          placeholder="Nom, prénom, numéro d'acte..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={chercher}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={chercher}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s: any, i: number) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestion}
              onPress={() => allerVersActe(s.id_acte)}
            >
              <Text style={styles.suggestionNum}>📄 {s.num_acte}</Text>
              <Text style={styles.suggestionNoms}>
                {s.personnes?.join(' • ') || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filtre par type */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtres}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        <TouchableOpacity
          style={[styles.filtreBadge, filtreType === '' && styles.filtreBadgeActif]}
          onPress={() => { setFiltreType(''); setQuery(''); }}
        >
          <Text style={[styles.filtreBadgeText, filtreType === '' && styles.filtreBadgeTextActif]}>
            Tous
          </Text>
        </TouchableOpacity>
        {types.map((t: any) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.filtreBadge, filtreType === String(t.id) && styles.filtreBadgeActif]}
            onPress={() => { setFiltreType(String(t.id)); setQuery(''); }}
          >
            <Text style={[styles.filtreBadgeText, filtreType === String(t.id) && styles.filtreBadgeTextActif]}>
              {t.libelle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste actes */}
      {loading ? (
        <ActivityIndicator size="large" color="#1a5276" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={actes}
          keyExtractor={(item, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.vide}>Aucun acte trouvé.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => allerVersActe(item.id_acte)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardNum}>{item.num_acte}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type_acte}</Text>
                </View>
              </View>

              {/* Personnes principales */}
              {Array.isArray(item.personnes) && item.personnes.map((p: any, i: number) => (
                <Text key={i} style={styles.cardNom}>
                  {p.prenom_personne} {p.nom_personne}
                </Text>
              ))}

              <Text style={styles.cardDate}>📅 {item.date_acte}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container          : { flex: 1, backgroundColor: '#f0f4f8' },
  header             : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour             : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre              : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sousTitre          : { fontSize: 13, color: '#aed6f1', marginTop: 4 },
  searchContainer    : { flexDirection: 'row', margin: 16, marginBottom: 8, gap: 8 },
  searchInput        : { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', elevation: 2 },
  searchBtn          : { backgroundColor: '#1a5276', borderRadius: 10, padding: 12, justifyContent: 'center', alignItems: 'center', width: 48 },
  searchBtnText      : { fontSize: 18 },
  suggestions        : { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, elevation: 3, zIndex: 10 },
  suggestion         : { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionNum      : { fontSize: 13, fontWeight: 'bold', color: '#1a5276' },
  suggestionNoms     : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  filtres            : { maxHeight: 50, marginBottom: 4 },
  filtreBadge        : { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  filtreBadgeActif   : { backgroundColor: '#1a5276', borderColor: '#1a5276' },
  filtreBadgeText    : { fontSize: 13, color: '#2c3e50' },
  filtreBadgeTextActif: { color: '#fff', fontWeight: 'bold' },
  vide               : { textAlign: 'center', color: '#7f8c8d', marginTop: 40, fontSize: 15 },
  card               : { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 3 },
  cardHeader         : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardNum            : { fontSize: 13, fontWeight: 'bold', color: '#1a5276' },
  typeBadge          : { backgroundColor: '#eaf0fb', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText      : { fontSize: 11, color: '#1a5276', fontWeight: 'bold' },
  cardNom            : { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  cardDate           : { fontSize: 12, color: '#95a5a6' },
});