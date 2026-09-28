import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Theme } from '@/constants/Theme';

function TabGlyph({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.glyph, { color }]}>{label}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.accent,
        tabBarInactiveTintColor: Theme.colors.muted,
        tabBarStyle: {
          backgroundColor: Theme.colors.white,
          borderTopColor: Theme.colors.line,
        },
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.bodyMedium,
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '备忘',
          tabBarIcon: ({ color }) => <TabGlyph label="记" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: '指南',
          tabBarIcon: ({ color }) => <TabGlyph label="问" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <TabGlyph label="设" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontFamily: Theme.fonts.display,
    fontSize: 18,
  },
});
