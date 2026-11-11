import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '../theme';

interface Companion3DViewProps {
  element?: string;
  onInteract?: () => void;
}

const PRIMARY_VIEWER_URL = 'http://127.0.0.1:3000/mascot.html';
const FALLBACK_VIEWER_URL = 'http://192.168.11.107:3000/mascot.html';

export default function Companion3DView({ element = 'Eau', onInteract }: Companion3DViewProps) {
  const [currentUrl, setCurrentUrl] = useState(PRIMARY_VIEWER_URL);
  const [modelLoaded, setModelLoaded] = useState(false);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded') {
        setModelLoaded(true);
      } else if (data.type === 'error') {
        console.warn('WebView 3D Error:', data.message);
        if (currentUrl === PRIMARY_VIEWER_URL) {
          setCurrentUrl(FALLBACK_VIEWER_URL);
        }
      }
    } catch (e) {
      // non-JSON message
    }
  };

  const handleError = () => {
    if (currentUrl === PRIMARY_VIEWER_URL) {
      console.log('127.0.0.1 failed for mascot.html, switching to WiFi IP');
      setCurrentUrl(FALLBACK_VIEWER_URL);
    }
  };

  return (
    <View style={styles.container}>
      {!modelLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingTitle}>Chargement du compagnon</Text>
          <Text style={styles.loadingText}>Connexion au sanctuaire 3D...</Text>
        </View>
      )}

      <WebView
        key={currentUrl}
        originWhitelist={['*']}
        mixedContentMode="always"
        source={{ uri: currentUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleError}
        scrollEnabled={false}
      />

      <TouchableOpacity activeOpacity={0.8} onPress={onInteract} style={styles.touchPill}>
        <View style={styles.pulseDot} />
        <Text style={styles.touchText}>Glisser pour pivoter a 360 degres</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8} onPress={onInteract} style={styles.elementPill}>
        <Text style={styles.elementText}>{element}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: colors.bg,
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  touchPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 47, 73, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  touchText: {
    color: '#bae6fd',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  elementPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  elementText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
