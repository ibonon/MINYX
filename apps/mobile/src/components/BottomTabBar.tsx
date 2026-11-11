import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';

export type TabKey = 'home' | 'chat' | 'memory' | 'evolution';

interface BottomTabBarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export default function BottomTabBar({ currentTab, onSelectTab }: BottomTabBarProps) {
  const tabs = [
    { key: 'home' as TabKey, label: 'Compagnon', icon: '💧' },
    { key: 'chat' as TabKey, label: 'Dialogue', icon: '💬' },
    { key: 'memory' as TabKey, label: 'Mémoire', icon: '🧠' },
    { key: 'evolution' as TabKey, label: 'Évolution', icon: '✨' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
  },
  container: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceStrong,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...shadow.glow,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.lg,
    position: 'relative',
    gap: 2,
  },
  tabButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.65,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
