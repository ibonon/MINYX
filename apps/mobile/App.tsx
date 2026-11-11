import React, { useState } from 'react';
import { StyleSheet, View, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreAllLogs(true);
import Header from './src/components/Header';
import BottomTabBar, { TabKey } from './src/components/BottomTabBar';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import MemoClawScreen from './src/screens/MemoClawScreen';
import EvolutionScreen from './src/screens/EvolutionScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  const handleNavigateToChat = (prompt?: string) => {
    setChatPrompt(prompt);
    setCurrentTab('chat');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Header />

      <View style={styles.screenContainer}>
        {currentTab === 'home' && (
          <HomeScreen
            onNavigateToChat={handleNavigateToChat}
            onNavigateToMemory={() => setCurrentTab('memory')}
            onNavigateToEvolution={() => setCurrentTab('evolution')}
          />
        )}

        {currentTab === 'chat' && <ChatScreen initialPrompt={chatPrompt} />}

        {currentTab === 'memory' && <MemoClawScreen />}

        {currentTab === 'evolution' && <EvolutionScreen />}
      </View>

        <BottomTabBar currentTab={currentTab} onSelectTab={setCurrentTab} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  screenContainer: {
    flex: 1,
  },
});

registerRootComponent(App);
