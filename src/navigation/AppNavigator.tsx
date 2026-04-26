import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily } from '../theme';
import { MarketsStackParamList, RootTabParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CryptoDetailScreen } from '../screens/CryptoDetailScreen';
import { AccuracyTrackerScreen } from '../screens/AccuracyTrackerScreen';
import { PredictionGameScreen } from '../screens/PredictionGameScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useAlertMonitor } from '../hooks/useAlertMonitor';
import { useAccuracyLogger } from '../hooks/useAccuracyLogger';
import { usePredictionDriftMonitor } from '../hooks/usePredictionDriftMonitor';
import { useOnboarding } from '../hooks/useOnboarding';
import { requestNotificationPermissions } from '../services/notificationService';

const Stack = createNativeStackNavigator<MarketsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function MarketsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
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
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text1,
          headerTitleStyle: { fontFamily: fontFamily.semibold, fontSize: 18 },
          headerShadowVisible: false,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text1,
          headerTitleStyle: { fontFamily: fontFamily.semibold, fontSize: 18 },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

function BackgroundServices() {
  useAlertMonitor();
  useAccuracyLogger();
  usePredictionDriftMonitor();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return null;
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <BackgroundServices />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 64 + insets.bottom,
            paddingTop: 10,
            paddingBottom: 10 + insets.bottom,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.text3,
          tabBarLabelStyle: {
            fontFamily: fontFamily.semibold,
            fontSize: 12,
            letterSpacing: 0.2,
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
          name="Accuracy"
          component={AccuracyTrackerScreen}
          options={{
            tabBarLabel: 'Track',
            tabBarIcon: ({ color, size }) => (
              <Icon source="bullseye-arrow" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Predict"
          component={PredictionGameScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="approximately-equal-box" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

export function AppNavigator() {
  const { loaded, choice } = useOnboarding();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.bg,
          card: colors.surface,
          text: colors.text1,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      {!loaded ? null : choice == null ? <OnboardingScreen /> : <MainTabs />}
    </NavigationContainer>
  );
}
