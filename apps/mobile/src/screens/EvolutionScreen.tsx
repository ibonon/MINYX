import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { minyxMobile } from '../services/minyxEngine';

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
        <Text style={styles.title}>Évolution Visuelle</Text>
        <Text style={styles.subtitle}>
          Génération en direct par Meta Muse Image & segmentation d'auras SAM 3.1
        </Text>
      </View>

      {/* Stage Selector Pills */}
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

      {/* Active Stage Card */}
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

        {/* SAM 3.1 Segmentation Features */}
        <Text style={styles.subSectionTitle}>SEGMENTATION D'AURAS (META SAM 3.1)</Text>
        <View style={styles.featuresRow}>
          {currentStage.sam3Features.map((feat) => (
            <View key={feat} style={styles.featurePill}>
              <Text style={styles.featureText}>✨ {feat}</Text>
            </View>
          ))}
        </View>

        {/* Muse Image Prompt Card */}
        <Text style={styles.subSectionTitle}>PROMPT GÉNÉRATIF TEMPS RÉEL (MUSE IMAGE)</Text>
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>"{currentStage.musePrompt}"</Text>
        </View>

        {/* Evolution Action Button */}
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
    backgroundColor: '#030712',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
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
    marginTop: 3,
  },
  stageTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stageTab: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stageTabActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38bdf8',
  },
  stageTabLevel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stageTabLevelActive: {
    color: '#38bdf8',
  },
  stageTabTitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
  },
  stageTabTitleActive: {
    color: '#f8fafc',
  },
  stageCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageLevelBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageLevelText: {
    color: '#38bdf8',
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
    color: '#f8fafc',
  },
  stageSubtitle: {
    fontSize: 13,
    color: '#7dd3fc',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  stageDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
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
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  featureText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  promptBox: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    marginBottom: 18,
  },
  promptText: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  evolveBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  evolveBtnText: {
    color: '#ffffff',
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
