import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';

export default function RechercheScreen() {
  const router = useRouter();
  const [query, setQuery]             = useState('');
  const [resultats, setResultats]     = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);

  const chercher = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await api.get(`/dashboard/recherche/?q=${query}`);
      setResultats(res.data.resultats || res.data);
    } catch {
      Alert.alert('Erreur', 'Recherche impossible.');
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
        <Text style={styles.titre}>Recherche archives</Text>
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

      {/* Résultats */}
      {loading ? (
        <ActivityIndicator size="large" color="#1a5276" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={resultats}
          keyExtractor={(item, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            query ? (
              <Text style={styles.vide}>Aucun résultat pour : {query}</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => allerVersActe(item.id_acte)}
            >
              <Text style={styles.cardNum}>{item.num_acte}</Text>
              <Text style={styles.cardNom}>
                {item.prenom_personne} {item.nom_personne}
              </Text>
              <Text style={styles.cardInfo}>
                {item.type_acte} — {item.commune || ''}
              </Text>
              <Text style={styles.cardDate}>
                {item.date_naissance?.split('T')[0]}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#f0f4f8' },
  header         : { backgroundColor: '#1a5276', padding: 24, paddingTop: 60 },
  retour         : { color: '#aed6f1', fontSize: 14, marginBottom: 8 },
  titre          : { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  searchContainer: { flexDirection: 'row', margin: 16, gap: 8 },
  searchInput    : { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#2c3e50', elevation: 2 },
  searchBtn      : { backgroundColor: '#1a5276', borderRadius: 10, padding: 12, justifyContent: 'center', alignItems: 'center', width: 48 },
  searchBtnText  : { fontSize: 18 },
  suggestions    : { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, elevation: 3, zIndex: 10 },
  suggestion     : { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionNum  : { fontSize: 13, fontWeight: 'bold', color: '#1a5276' },
  suggestionNoms : { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  vide           : { textAlign: 'center', color: '#7f8c8d', marginTop: 40, fontSize: 15 },
  card           : { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 3 },
  cardNum        : { fontSize: 13, fontWeight: 'bold', color: '#1a5276', marginBottom: 4 },
  cardNom        : { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  cardInfo       : { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
  cardDate       : { fontSize: 12, color: '#95a5a6', marginTop: 2 },
});