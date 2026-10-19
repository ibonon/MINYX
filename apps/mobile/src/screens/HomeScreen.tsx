import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Companion3DView from '../components/Companion3DView';
import { minyxMobile } from '../services/minyxEngine';

interface HomeScreenProps {
  onNavigateToChat: (initialPrompt?: string) => void;
  onNavigateToMemory: () => void;
  onNavigateToEvolution: () => void;
}

export default function HomeScreen({
  onNavigateToChat,
  onNavigateToMemory,
  onNavigateToEvolution,
}: HomeScreenProps) {
  const companion = minyxMobile.getCompanion();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 3D Mascot Interactive Sanctuary */}
      <View style={styles.mascotWrapper}>
        <Companion3DView element={companion.element} />
      </View>

      {/* Identity & Element Header */}
      <View style={styles.identityCard}>
        <View style={styles.nameRow}>
          <Text style={styles.companionName}>{companion.name}</Text>
          <View style={styles.elementBadge}>
            <Text style={styles.elementText}>💧 {companion.element}</Text>
          </View>
        </View>
        <Text style={styles.moodText}>Humeur : {companion.mood}</Text>

        {/* XP Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressMeta}>
            <Text style={styles.levelLabel}>Niveau {companion.level}</Text>
            <Text style={styles.xpLabel}>
              {companion.xp} / {companion.xpToNextLevel} XP
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(companion.xp / companion.xpToNextLevel) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.int}</Text>
            <Text style={styles.statLabel}>Intelligence</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.emo}</Text>
            <Text style={styles.statLabel}>Émotion</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.agi}</Text>
            <Text style={styles.statLabel}>Agilité</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.bond}%</Text>
            <Text style={styles.statLabel}>Lien</Text>
          </View>
        </View>
      </View>

      {/* Quick Action Chips (Meta Native Tool Calling & Memory) */}
      <Text style={styles.sectionTitle}>ACTIONS RAPIDES (META LLAMA 3.3)</Text>
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={styles.actionChip}
          activeOpacity={0.7}
          onPress={() => onNavigateToChat('Rappelle-moi de répéter la démo du hackathon à 16h')}
        >
          <Text style={styles.chipEmoji}>⏰</Text>
          <Text style={styles.chipText}>Programmer un rappel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionChip}
          activeOpacity={0.7}
          onPress={() => onNavigateToChat('Cherche les dernières nouvelles sur Meta Llama 3.3')}
        >
          <Text style={styles.chipEmoji}>🔍</Text>
          <Text style={styles.chipText}>Recherche web en direct</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionChip}
          activeOpacity={0.7}
          onPress={onNavigateToMemory}
        >
          <Text style={styles.chipEmoji}>🧠</Text>
          <Text style={styles.chipText}>Ce que je sais de toi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionChip}
          activeOpacity={0.7}
          onPress={onNavigateToEvolution}
        >
          <Text style={styles.chipEmoji}>✨</Text>
          <Text style={styles.chipText}>Évolution visuelle Muse</Text>
        </TouchableOpacity>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        style={styles.primaryCta}
        activeOpacity={0.8}
        onPress={() => onNavigateToChat()}
      >
        <Text style={styles.ctaText}>Ouvrir le dialogue avec {companion.name} →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    paddingBottom: 40,
  },
  mascotWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    marginHorizontal: 16,
    marginTop: -10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 18,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companionName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f0f9ff',
    letterSpacing: 0.5,
  },
  elementBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  elementText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  moodText: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  progressSection: {
    marginTop: 16,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelLabel: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '700',
  },
  xpLabel: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00f0ff',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 24,
    marginHorizontal: 18,
    marginBottom: 10,
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 6,
  },
  chipEmoji: {
    fontSize: 15,
    marginRight: 8,
  },
  chipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryCta: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
