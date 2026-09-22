import { ThemeContext } from '@/action/theme/ThemeContext';
import {
  getPhoneSize,
  getResponsiveFontSize,
  scaleFont,
  scaleH,
  scaleW
} from '@/utils/responsivedesignsystem';
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
  const phoneSize = getPhoneSize();
  const fonts = getResponsiveFontSize();

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
          paddingBottom: insets.bottom > 0 ? insets.bottom : scaleH(12),
        },
      ]}
    >
      <View
        style={[
          styles.tabBarContainer,
          {
            width: width * 0.92,
            backgroundColor: theme.background,
            borderColor: theme.background,
            height: scaleH(65),
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.title ?? route.name;

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
                    colors={[theme.primary, theme.primary]}
                    style={[
                      styles.gradientIcon,
                      {
                        width: scaleW(40),
                        height: scaleW(40),
                        borderRadius: scaleW(20),
                      },
                    ]}
                  >
                    <Ionicons
                      name={getIcon(route.name, true) as any}
                      size={scaleFont(20)}
                      color="#fff"
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.activeLabel,
                      {
                        color: theme.text,
                        fontSize: fonts.tiny,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveContainer}>
                  <Ionicons
                    name={getIcon(route.name, false) as any}
                    size={scaleFont(22)}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.inactiveLabel,
                      {
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        fontSize: fonts.tiny,
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
    borderRadius: scaleW(35),
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleH(10) },
    shadowOpacity: 0.12,
    shadowRadius: scaleW(15),
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleH(4),
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: scaleH(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleW(8),
  },

  activeLabel: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  inactiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  inactiveLabel: {
    fontWeight: '500',
    marginTop: scaleH(4),
    textTransform: 'capitalize',
  },
});
