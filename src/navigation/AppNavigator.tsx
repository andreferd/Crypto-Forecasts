import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { MarketsStackParamList, RootTabParamList } from '../types/navigation';
import { WalletGate } from '../components/WalletGate';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CryptoDetailScreen } from '../screens/CryptoDetailScreen';
import { DigestScreen } from '../screens/DigestScreen';
import { AccuracyTrackerScreen } from '../screens/AccuracyTrackerScreen';
import { PredictionGameScreen } from '../screens/PredictionGameScreen';
import { useAlertMonitor } from '../hooks/useAlertMonitor';
import { useAccuracyLogger } from '../hooks/useAccuracyLogger';
import { useDigest } from '../hooks/useDigest';
import { requestNotificationPermissions } from '../services/notificationService';

const Stack = createNativeStackNavigator<MarketsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function MarketsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="CryptoDetail"
        component={CryptoDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.symbol,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}

function BackgroundServices() {
  useAlertMonitor();
  useAccuracyLogger();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return null;
}

function DigestTabWrapper() {
  return <DigestScreen />;
}

function MainTabs() {
  const { hasSignificantChanges, isFirstVisit } = useDigest();
  const showDigestBadge = hasSignificantChanges && !isFirstVisit;

  return (
    <>
      <BackgroundServices />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Markets"
          component={MarketsStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="chart-line" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Digest"
          component={DigestTabWrapper}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="newspaper-variant-outline" size={size} color={color} />
            ),
            tabBarBadge: showDigestBadge ? '' : undefined,
            tabBarBadgeStyle: showDigestBadge
              ? {
                  backgroundColor: Colors.accent,
                  minWidth: 8,
                  maxHeight: 8,
                  borderRadius: 4,
                  marginTop: 4,
                }
              : undefined,
          }}
        />
        <Tab.Screen
          name="Accuracy"
          component={AccuracyTrackerScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="target" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Predict"
          component={PredictionGameScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="crystal-ball" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.accent,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.text,
          border: Colors.border,
          notification: Colors.accent,
        },
      }}
    >
      <WalletGate>
        <MainTabs />
      </WalletGate>
    </NavigationContainer>
  );
}
