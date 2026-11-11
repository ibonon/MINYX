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
import { colors, radius, shadow, spacing } from '../theme';

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
    minyxMobile.addMemory(newNamespace, newKey.trim(), newValue.trim());
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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MemoClaw</Text>
        <Text style={styles.title}>Memoire persistante</Text>
        <Text style={styles.subtitle}>
          Retrouve les faits, preferences et evenements retenus par le compagnon.
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un souvenir ou un fait..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

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

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ Ajouter un fait</Text>
      </TouchableOpacity>

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
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.md,
    gap: 8,
    backgroundColor: colors.bg,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterScroll: {
    marginTop: 4,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
  },
  filterText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 92,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textFaint,
    fontWeight: '600',
  },
  keyText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    ...shadow.glow,
  },
  fabText: {
    color: '#04111d',
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalNsBtnActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.primarySoft,
  },
  modalNsText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalNsTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmText: {
    color: '#04111d',
    fontSize: 13,
    fontWeight: '700',
  },
});
