import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { minyxMobile } from '../services/minyxEngine';
import { colors, radius, shadow, spacing } from '../theme';

export default function EvolutionScreen() {
  const stages = minyxMobile.getEvolutionStages();
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);
  const currentStage = stages[selectedStageIdx];

  const handleSimulateEvolution = (targetIdx: number) => {
    setSelectedStageIdx(targetIdx);
    Alert.alert(
      'Évolution Muse Image simulée',
      `Forme générée avec succès pour le palier "${stages[targetIdx].title}" ! Le shader et les auras SAM 3.1 ont été actualisés.`,
      [{ text: 'Super !' }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Evolution</Text>
        <Text style={styles.title}>Parcours visuel du compagnon</Text>
        <Text style={styles.subtitle}>
          Une lecture plus claire des paliers, de l'aura et des prompts de generation.
        </Text>
      </View>

      <View style={styles.stageTabs}>
        {stages.map((stage, idx) => {
          const isSelected = selectedStageIdx === idx;
          return (
            <TouchableOpacity
              key={stage.level}
              style={[styles.stageTab, isSelected && styles.stageTabActive]}
              onPress={() => setSelectedStageIdx(idx)}
            >
              <Text style={[styles.stageTabLevel, isSelected && styles.stageTabLevelActive]}>
                Palier {stage.level}
              </Text>
              <Text
                style={[styles.stageTabTitle, isSelected && styles.stageTabTitleActive]}
                numberOfLines={1}
              >
                {stage.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.stageCard}>
        <View style={styles.badgeRow}>
          <View style={styles.stageLevelBadge}>
            <Text style={styles.stageLevelText}>NIVEAU REQUIS : {currentStage.level}</Text>
          </View>
          {selectedStageIdx === 0 && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>FORME ACTUELLE</Text>
            </View>
          )}
        </View>

        <Text style={styles.stageTitle}>{currentStage.title}</Text>
        <Text style={styles.stageSubtitle}>{currentStage.subtitle}</Text>
        <Text style={styles.stageDescription}>{currentStage.description}</Text>

        <Text style={styles.subSectionTitle}>SEGMENTATION D'AURAS (META SAM 3.1)</Text>
        <View style={styles.featuresRow}>
          {currentStage.sam3Features.map((feat) => (
            <View key={feat} style={styles.featurePill}>
              <Text style={styles.featureText}>✨ {feat}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subSectionTitle}>PROMPT GÉNÉRATIF TEMPS RÉEL (MUSE IMAGE)</Text>
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>"{currentStage.musePrompt}"</Text>
        </View>

        {selectedStageIdx !== 0 ? (
          <TouchableOpacity
            style={styles.evolveBtn}
            activeOpacity={0.8}
            onPress={() => handleSimulateEvolution(selectedStageIdx)}
          >
            <Text style={styles.evolveBtnText}>
              Invoquer l'évolution : {currentStage.title} ⚡
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerText}>
              ✓ Cette forme est actuellement active dans votre sanctuaire 3D
            </Text>
          </View>
        )}
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
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  stageTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  stageTab: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageTabActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
  },
  stageTabLevel: {
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stageTabLevelActive: {
    color: colors.primary,
  },
  stageTabTitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  stageTabTitleActive: {
    color: colors.text,
  },
  stageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadow.glow,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageLevelBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  stageLevelText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  currentBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  stageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  stageSubtitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  stageDescription: {
    fontSize: 13,
    color: colors.textSoft,
    lineHeight: 19,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textFaint,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  featurePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  promptBox: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  promptText: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  evolveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  evolveBtnText: {
    color: '#04111d',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  activeBanner: {
    backgroundColor: 'rgba(2, 44, 34, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeBannerText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '700',
  },
});
