export type AppTheme = {
  // Base Colors
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  placeholder: string;

  // Borders
  border: string;
  borderLight: string;

  // Primary / Accent Colors
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;

  // Status / Feedback Colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Domain semantics (split balances) — reserved meaning, do not reuse for brand
  positive: string; // you are owed / net positive
  negative: string; // you owe / net negative
  accent: string; // amber highlight / tertiary action

  // Buttons
  buttonBackground: string;
  buttonPrimaryBackground: string;
  buttonText: string;
  buttonTextPrimary: string;
  buttonTextSecondary: string;
  buttonBorder: string;

  // Inputs
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  inputFocusBorder: string;

  // Modals / Overlays
  overlay: string;
  modalBackground: string;

  // Tabs / Navigation
  tabBarBackground: string;
  tabBarIconActive: string;
  tabBarIconInactive: string;

  // Misc
  shadowColor: string;
  cardBackground: string;
  rippleColor: string;

  // System
  isDark: boolean;

  senderBackground: string;
  receiverBackground: string;

  senderText: string;
  receiverText: string;

  // Chat specific
  chatDateHeaderBackground: string;
  chatDateHeaderText: string;

  // Gradients
  gradientPrimary: string[];
  gradientAccent: string[];
};

export const lightTheme: AppTheme = {
  background: '#FFFFFF',
  surface: '#F6F6F6',
  text: '#000000',
  mutedText: '#6B7280',
  placeholder: '#9CA3AF',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  primary: '#6366F1',
  primaryLight: '#818CF8',
  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#6366F1',

  positive: '#16A34A',
  negative: '#DC2626',
  accent: '#F59E0B',

  buttonBackground: '#6366F1',
  buttonPrimaryBackground: '#6366F1',
  buttonText: '#121212',
  buttonTextPrimary: '#FFFFFF',
  buttonTextSecondary: '#FFFFFF',
  buttonBorder: '#6366F1',

  inputBackground: '#f7f7f7',
  inputText: '#121212',
  inputBorder: '#D1D5DB',
  inputFocusBorder: '#6366F1',

  overlay: 'rgba(0, 0, 0, 0.3)',
  modalBackground: '#FFFFFF',

  tabBarBackground: '#F0F0F0',
  tabBarIconActive: '#6366F1',
  tabBarIconInactive: '#A0AEC0',

  shadowColor: '#000000',
  cardBackground: '#FFFFFF',
  rippleColor: 'rgba(0, 0, 0, 0.1)',

  isDark: false,

  senderBackground: '#6366F1', // Use primary indigo for sender
  receiverBackground: '#F3F4F6', // Subtle grey for receiver

  senderText: '#FFFFFF',
  receiverText: '#121212',

  chatDateHeaderBackground: '#E5E7EB',
  chatDateHeaderText: '#6B7280',

  gradientPrimary: ['#312E81', '#4338CA', '#4F46E5', '#6366F1'],
  gradientAccent: ['#4F46E5', '#6366F1', '#818CF8'],
};

export const darkTheme: AppTheme = {
  background: '#121212',
  surface: '#121212',
  text: '#FFFFFF',
  mutedText: '#9CA3AF',
  placeholder: '#6B7280',

  border: '#2D2D2D',
  borderLight: '#3A3A3A',

  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  secondary: '#FBBF24',
  secondaryLight: '#FDE68A',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#818CF8',

  positive: '#34D399',
  negative: '#F87171',
  accent: '#FBBF24',

  buttonBackground: '#6366F1',
  buttonPrimaryBackground: '#6366F1',
  buttonText: '#FFFFFF',
  buttonTextPrimary: '#FFFFFF',
  buttonTextSecondary: '#121212',
  buttonBorder: '#6366F1',

  inputBackground: '#1C1C1E',
  inputText: '#FFFFFF',
  inputBorder: '#2C2C2E',
  inputFocusBorder: '#818CF8',

  overlay: 'rgba(255, 255, 255, 0.2)',
  modalBackground: '#1C1C1E',

  tabBarBackground: '#242424',
  tabBarIconActive: '#818CF8',
  tabBarIconInactive: '#7C7C7C',

  shadowColor: '#000000',
  cardBackground: '#1E1E1E',
  rippleColor: 'rgba(255, 255, 255, 0.1)',

  isDark: true,

  senderBackground: '#6366F1', // Use primary indigo for sender
  receiverBackground: '#1C1C1E', // Dark surface for receiver

  senderText: '#FFFFFF',
  receiverText: '#FFFFFF',

  chatDateHeaderBackground: '#2C2C2E',
  chatDateHeaderText: '#9CA3AF',

  gradientPrimary: ['#1E1B4B', '#312E81', '#4338CA', '#6366F1'],
  gradientAccent: ['#3730A3', '#4F46E5', '#6366F1'],
};
