import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { MemoryNamespace, MemoryRecord } from '../types';
import { minyxMobile } from '../services/minyxEngine';

export default function MemoClawScreen() {
  const [selectedNamespace, setSelectedNamespace] = useState<MemoryNamespace | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<MemoryRecord[]>(minyxMobile.getMemories());

  // Add memory modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newNamespace, setNewNamespace] = useState<MemoryNamespace>('core');

  const filtered = memories.filter((m) => {
    const matchNamespace = selectedNamespace === 'all' || m.namespace === selectedNamespace;
    const matchSearch =
      !searchQuery ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchNamespace && matchSearch;
  });

  const handleAddMemory = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const created = minyxMobile.addMemory(newNamespace, newKey.trim(), newValue.trim());
    setMemories(minyxMobile.getMemories());
    setNewKey('');
    setNewValue('');
    setModalVisible(false);
  };

  const getNamespaceBadge = (ns: MemoryNamespace) => {
    switch (ns) {
      case 'core':
        return { label: 'CORE', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'events':
        return { label: 'ÉVÉNEMENT', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' };
      case 'preferences':
        return { label: 'PRÉFÉRENCE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'moods':
        return { label: 'HUMEUR', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>MemoClaw</Text>
        <Text style={styles.subtitle}>
          Système de mémoire cognitive persistante en 4 espaces
        </Text>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un souvenir ou un fait..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['all', 'core', 'events', 'preferences', 'moods'] as const).map((ns) => {
            const isSelected = selectedNamespace === ns;
            return (
              <TouchableOpacity
                key={ns}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedNamespace(ns)}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {ns === 'all'
                    ? 'Tous'
                    : ns === 'core'
                    ? 'Identité'
                    : ns === 'events'
                    ? 'Événements'
                    : ns === 'preferences'
                    ? 'Préférences'
                    : 'Humeurs'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Memory Cards Feed */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filtered.map((item) => {
          const badge = getNamespaceBadge(item.namespace);
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
                <Text style={styles.confidenceText}>
                  Précision : {Math.round(item.confidence * 100)}%
                </Text>
              </View>

              <Text style={styles.keyText}>{item.key.replace(/_/g, ' ')}</Text>
              <Text style={styles.valueText}>{item.value}</Text>
              <Text style={styles.timestampText}>Enregistré : {item.timestamp}</Text>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun souvenir trouvé dans cet espace.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Memory Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ Ajouter un fait</Text>
      </TouchableOpacity>

      {/* Modal Add Memory */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau souvenir MemoClaw</Text>

            <Text style={styles.inputLabel}>ESPACE DE MÉMOIRE</Text>
            <View style={styles.namespaceRow}>
              {(['core', 'events', 'preferences', 'moods'] as MemoryNamespace[]).map((ns) => (
                <TouchableOpacity
                  key={ns}
                  style={[
                    styles.modalNsBtn,
                    newNamespace === ns && styles.modalNsBtnActive,
                  ]}
                  onPress={() => setNewNamespace(ns)}
                >
                  <Text
                    style={[
                      styles.modalNsText,
                      newNamespace === ns && styles.modalNsTextActive,
                    ]}
                  >
                    {ns}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>CLÉ (EX: PROJET_ACTUEL)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ex: passion_musique"
              placeholderTextColor="#64748b"
              value={newKey}
              onChangeText={setNewKey}
            />

            <Text style={styles.inputLabel}>VALEUR DÉTAILLÉE</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              placeholder="Ce dont le compagnon doit se souvenir..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={newValue}
              onChangeText={setNewValue}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddMemory}>
                <Text style={styles.confirmText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  filterScroll: {
    marginTop: 12,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
    borderColor: '#38bdf8',
  },
  filterText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  confidenceText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  keyText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#f8fafc',
    lineHeight: 20,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7dd3fc',
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  namespaceRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  modalNsBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalNsBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
  },
  modalNsText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalNsTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  modalInputMulti: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
