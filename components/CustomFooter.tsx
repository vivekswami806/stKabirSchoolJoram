import { ThemeContext } from '@/action/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const themeState = useContext(ThemeContext);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!themeState) return null;

  const { theme } = themeState;
  const isDark = theme.mode === 'dark';

  const getIcon = (name: string, focused: boolean) => {
    switch (name) {
      case 'home':
        return focused ? 'home' : 'home-outline';
      case 'calendar':
        return focused ? 'calendar' : 'calendar-outline';
      case 'messages':
        return focused
          ? 'chatbubble-ellipses'
          : 'chatbubble-ellipses-outline';
      case 'profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'square';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        },
      ]}
    >
      <View
        style={[
          styles.tabBarContainer,
          {
            width: width * 0.92,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {isFocused ? (
                <View style={styles.activeContainer}>
                  <LinearGradient
                    colors={['#667eea', '#667eea']}
                    style={styles.gradientIcon}
                  >
                    <Ionicons
                      name={getIcon(route.name, true) as any}
                      size={20}
                      color="#fff"
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.activeLabel,
                      { color: theme.text },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveContainer}>
                  <Ionicons
                    name={getIcon(route.name, false) as any}
                    size={22}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.inactiveLabel,
                      {
                        color: isDark
                          ? '#9CA3AF'
                          : '#6B7280',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 65,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,

    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  inactiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'capitalize',
  },
});
