class TrieNode:
    def __init__(self):
        self.lettre  = {}   # table de hachage : caractère → nœud
        self.actes_ids = []   # IDs des actes associés à ce préfixe

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, mot, acte_id):
        node = self.root
        for c in mot.lower():
            if c not in node.lettre:
                node.lettre[c] = TrieNode()
            node = node.lettre[c]
            if acte_id not in node.actes_ids:
                node.actes_ids.append(acte_id)

    def search_prefix(self, prefix, limite=10):
        if not prefix or len(prefix) < 2:
            return []
        node = self.root
        for c in prefix.lower():
            if c not in node.lettre:
                return []
            node = node.lettre [c]
        return list(set(node.actes_ids))[:limite]


# if __name__ == "__main__":

#     trie = Trie()

#     # Données simulant vos vrais actes
#     donnees = [
#         ("rakoto",         1),
#         ("rakotomalala",   2),
#         ("rakotondrazafy", 3),
#         ("rabe",           4),
#         ("rabeson",        5),
#         ("rasoa",          6),
#         ("jean",           1),  # prénom du même acte que "rakoto"
#         ("paul",           4),  # prénom du même acte que "rabe"
#     ]

#     for mot, acte_id in donnees:
#         trie.insert(mot, acte_id)

#     # ── Tests attendus ──────────────────────────
#     assert trie.search_prefix("rako") == [1, 2, 3],        "FAIL rako"
#     assert trie.search_prefix("rabe") == [4, 5],           "FAIL rabe"
#     assert trie.search_prefix("jean") == [1],              "FAIL jean"
#     assert trie.search_prefix("xyz")  == [],               "FAIL xyz"
#     assert trie.search_prefix("r")    == [],               "FAIL r court"
#     # prénom + nom du même acte → pas de doublon
#     assert trie.search_prefix("rako").count(1) == 1,       "FAIL doublon acte 1"

#     print("Tous les tests passent")