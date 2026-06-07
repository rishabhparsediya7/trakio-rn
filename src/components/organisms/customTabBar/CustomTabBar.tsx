// components/CustomTabBar.tsx
import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TabButton from '@organisms/customTabBar/TabButton';
import { useMemo } from 'react';
import { useTheme } from '../../../providers/ThemeContext';
import { darkTheme, lightTheme } from '../../../providers/Theme';

type Props = BottomTabBarProps & {
  onAddPress?: () => void;
};

const CustomTabBar = ({ state, navigation, onAddPress }: Props) => {
  const focusedIndex = state.index;
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(() => StyleSheet.create({
    tabBarContainer: {
      flexDirection: 'row',
      height: 84,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    addSlot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Keeps the rounded tab-bar strip continuous behind the floating button.
    addSlotStrip: {
      position: 'absolute',
      bottom: 4,
      left: 0,
      right: 0,
      height: 72,
      backgroundColor: colors.tabBarBackground,
    },
    addButton: {
      position: 'absolute',
      top: -28,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.background,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
        },
        android: {
          elevation: 8,
        },
      }),
    },
  }), [theme]);

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = focusedIndex === index;
        const isLeftOfFocused = focusedIndex > index;
        const isRightOfFocused = focusedIndex < index;

        // Center "Add" slot — opens the action sheet instead of navigating.
        if (route.name === 'Add') {
          return (
            <View key={route.key} style={styles.addSlot}>
              <View style={styles.addSlotStrip} />
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.85}
                onPress={() => onAddPress?.()}>
                <Ionicons name="add" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TabButton
            key={route.key}
            index={index}
            focusedIndex={focusedIndex}
            routeName={route.name}
            isFocused={isFocused}
            isLeftOfFocused={isLeftOfFocused}
            isRightOfFocused={isRightOfFocused}
            maxIndex={state.routes.length - 1}
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
  );
};



export default CustomTabBar;
