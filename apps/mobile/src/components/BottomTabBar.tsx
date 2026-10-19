import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.2)',
    paddingBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabButtonActive: {},
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#00f0ff',
  },
});
