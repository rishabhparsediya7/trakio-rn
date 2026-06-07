// components/CustomTabBar.tsx
import React, {useMemo} from 'react';
import {View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TabButton from '@organisms/customTabBar/TabButton';
import {useTheme} from '../../../providers/ThemeContext';
import {darkTheme, lightTheme} from '../../../providers/Theme';

type Props = BottomTabBarProps & {
  onAddPress?: () => void;
};

const CustomTabBar = ({state, navigation, onAddPress}: Props) => {
  const focusedIndex = state.index;
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          height: 84,
          justifyContent: 'center',
          backgroundColor: colors.background,
        },
        // One continuous rounded pill behind all tabs — no gaps, no sharp corners.
        track: {
          position: 'absolute',
          left: 12,
          right: 12,
          top: 12,
          bottom: 12,
          borderRadius: 30,
          backgroundColor: colors.tabBarBackground,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadowColor,
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.12,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          paddingHorizontal: 12,
        },
        addSlot: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        // Action button — vertically centered in the track, aligned with the
        // other tab icons. The ring of screen background gives it a seated look.
        addButton: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: colors.background,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.4,
              shadowRadius: 6,
            },
            android: {
              elevation: 8,
            },
          }),
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <View style={styles.track} />
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = focusedIndex === index;

          // Center "Add" slot — opens the action sheet instead of navigating.
          if (route.name === 'Add') {
            return (
              <View key={route.key} style={styles.addSlot}>
                <TouchableOpacity
                  style={styles.addButton}
                  activeOpacity={0.85}
                  onPress={() => onAddPress?.()}>
                  <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TabButton
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default CustomTabBar;
