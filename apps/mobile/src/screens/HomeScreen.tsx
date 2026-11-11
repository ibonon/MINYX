import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Companion3DView from '../components/Companion3DView';
import { minyxMobile } from '../services/minyxEngine';
import { colors, radius, shadow, spacing } from '../theme';

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
      <View style={styles.heroCard}>
        <Companion3DView element={companion.element} />
      </View>

      <View style={styles.identityCard}>
        <View style={styles.identityHeader}>
          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.companionName}>{companion.name}</Text>
              <View style={styles.elementBadge}>
                <Text style={styles.elementText}>{companion.element}</Text>
              </View>
            </View>
            <Text style={styles.moodText}>Humeur du moment : {companion.mood}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeLabel}>Niveau</Text>
            <Text style={styles.levelBadgeValue}>{companion.level}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressMeta}>
            <Text style={styles.levelLabel}>Progression</Text>
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

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.int}</Text>
            <Text style={styles.statLabel}>INT</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.emo}</Text>
            <Text style={styles.statLabel}>EMO</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.agi}</Text>
            <Text style={styles.statLabel}>AGI</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{companion.stats.bond}%</Text>
            <Text style={styles.statLabel}>Lien</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>Actions rapides</Text>
        <Text style={styles.sectionTitle}>Ce que ton compagnon peut faire maintenant</Text>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => onNavigateToChat('Rappelle-moi de répéter la démo du hackathon à 16h')}
        >
          <Text style={styles.cardIcon}>⏰</Text>
          <Text style={styles.cardTitle}>Créer un rappel</Text>
          <Text style={styles.cardText}>Planifie une alerte locale pour le pitch ou une tâche.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => onNavigateToChat('Cherche les dernières nouvelles sur Meta Llama 3.3')}
        >
          <Text style={styles.cardIcon}>🔍</Text>
          <Text style={styles.cardTitle}>Recherche web</Text>
          <Text style={styles.cardText}>Récupère un résumé rapide pour nourrir la discussion.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={onNavigateToMemory}
        >
          <Text style={styles.cardIcon}>🧠</Text>
          <Text style={styles.cardTitle}>Mémoire persistante</Text>
          <Text style={styles.cardText}>Consulte ce que MemoClaw a retenu de vos échanges.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={onNavigateToEvolution}
        >
          <Text style={styles.cardIcon}>✨</Text>
          <Text style={styles.cardTitle}>Évolution visuelle</Text>
          <Text style={styles.cardText}>Explore les paliers de forme et l'apparence générée.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.primaryPanel}>
        <View style={styles.primaryCopy}>
          <Text style={styles.primaryEyebrow}>Session en direct</Text>
          <Text style={styles.primaryTitle}>Ouvrir le dialogue avec {companion.name}</Text>
          <Text style={styles.primaryText}>
            Passe de l'observation a l'action pour lancer un rappel, une recherche ou une discussion.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryCta}
          activeOpacity={0.8}
          onPress={() => onNavigateToChat()}
        >
          <Text style={styles.ctaText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 36,
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.glow,
  },
  heroCaption: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroCaptionText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  identityCopy: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  companionName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  elementBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  elementText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  moodText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  levelBadge: {
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  levelBadgeLabel: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  levelBadgeValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  progressSection: {
    gap: 8,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  xpLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: colors.textFaint,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sectionHeader: {
    gap: 4,
    paddingHorizontal: 2,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48.5%',
    minHeight: 132,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  primaryPanel: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
  },
  primaryCopy: {
    gap: 6,
  },
  primaryEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  primaryText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  primaryCta: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  ctaText: {
    color: '#04111d',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
