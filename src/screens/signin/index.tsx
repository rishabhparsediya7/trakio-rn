import React, {useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Icons from '@atoms/icons';
import Button from '@atoms/Button';
import {useAuthorizeNavigation} from '../../navigators/navigators';
import {useAuth} from '../../providers/AuthProvider';
import {lightTheme} from '../../providers/Theme';
import {commonStyles} from '../../utils/styles';
import {signInWithGitHub} from './githubSigninUtil';
import {googleSignIn} from './googleSigninUtil';

const SignInScreen = ({navigation}) => {
  const {signInWithGoogle} = useAuth();
  const [signInForm, setSignInForm] = useState({
    email:
      process.env.ENV === 'development' ? 'parsediyarishabh@gmail.com' : '',
    password: process.env.ENV === 'development' ? 'Rishabh@12' : '',
  });
  const [error, setError] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const {signInWithPassword} = useAuth();
  const authNavigation = useAuthorizeNavigation();

  const colors = lightTheme;

  const handleSignIn = async () => {
    if (!signInForm.email || !signInForm.password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const response = await signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      });
      if (!response.success) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message,
        });
        return;
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getGitHubUser = async (accessToken: string) => {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return await res.json();
  };

  const handleGitHubSignIn = async () => {
    try {
      setGithubLoading(true);
      const result = await signInWithGitHub();

      if ('success' in result) {
        throw new Error(result.error || 'Failed to sign in with GitHub');
      }

      const user = await getGitHubUser(result.accessToken);
    } catch (error) {
      console.log('Error signing in:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to sign in with GitHub',
      );
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const {success, userInfo} = await googleSignIn();
      if (success) {
        const idToken = userInfo?.data?.idToken || '';
        const response = await signInWithGoogle({idToken});
        if (!response?.success || !response?.token) {
          setError(response?.message || 'Failed to sign in with Google');
        }
      } else {
        setError('Failed to sign in with Google');
      }
    } catch (error) {
      console.log('Error signing in:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to sign in with Google',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const importedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          fontSize: 40,
          marginBottom: 10,
          ...commonStyles.textExtraBold,
          color: colors.text,
        },
        subHeader: {
          fontSize: 16,
          color: colors.text,
          marginBottom: 30,
          ...commonStyles.textMedium,
        },
        scrollContainer: {padding: 24, justifyContent: 'center', flexGrow: 1},
        googleIcon: {
          marginRight: 10,
          color: colors.buttonText,
        },
        githubIcon: {
          marginRight: 10,
          color: colors.text,
        },
        dividerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 16,
        },
        divider: {flex: 1, height: 1},
        or: {marginHorizontal: 12, color: colors.mutedText},
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inputBackground,
          padding: 14,
          borderRadius: 10,
          marginBottom: 16,
          color: colors.inputText,
        },
        passwordContainer: {
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          paddingHorizontal: 14,
          borderRadius: 10,
          marginBottom: 20,
        },
        inputInner: {
          flex: 1,
          paddingVertical: 14,
          color: colors.inputText,
        },
        terms: {
          fontSize: 14,
          color: colors.mutedText,
          textAlign: 'left',
          marginBottom: 10,
          ...commonStyles.textMedium,
        },
        link: {
          color: colors.mutedText,
          fontWeight: 'bold',
          ...commonStyles.textMedium,
          fontSize: 14,
        },
        footer: {
          textAlign: 'center',
          color: colors.mutedText,
          ...commonStyles.textMedium,
          fontSize: 14,
        },
        error: {color: 'red', marginBottom: 10},
        forgotPasswordBtn: {
          alignSelf: 'flex-end',
          marginBottom: 16,
          marginTop: -6,
        },
        forgotPasswordText: {
          color: colors.primary,
          ...commonStyles.textMedium,
          fontSize: 14,
        },
      }),
    [],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={importedStyles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <ScrollView
        contentContainerStyle={importedStyles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <Text style={importedStyles.header}>Welcome Back</Text>
        <Text style={importedStyles.subHeader}>Sign in to continue</Text>

        <Button
          title="Continue with GitHub"
          onPress={handleGitHubSignIn}
          loading={githubLoading}
          variant="outline"
          icon={
            <Icons.GithubIcon
              style={importedStyles.githubIcon}
              width={28}
              height={28}
              color={colors.text}
            />
          }
          style={{marginBottom: 20}}
        />

        <Button
          title="Continue with Google"
          onPress={handleGoogleSignIn}
          loading={googleLoading}
          icon={
            <Icons.GoogleIcon
              style={importedStyles.googleIcon}
              width={24}
              height={24}
            />
          }
          variant="outline"
          style={{marginBottom: 20}}
        />

        <View style={importedStyles.dividerContainer}>
          <LinearGradient
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            colors={['transparent', colors.borderLight]}
            style={importedStyles.divider}
          />

          <Text style={importedStyles.or}>or</Text>

          <LinearGradient
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            colors={[colors.borderLight, 'transparent']}
            style={importedStyles.divider}
          />
        </View>

        <TextInput
          placeholder="Email"
          value={signInForm.email}
          onChangeText={text => setSignInForm({...signInForm, email: text})}
          style={importedStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.placeholder}
        />

        <View style={importedStyles.passwordContainer}>
          <TextInput
            placeholder="Password"
            value={signInForm.password}
            onChangeText={text =>
              setSignInForm({...signInForm, password: text})
            }
            secureTextEntry={secureText}
            style={importedStyles.inputInner}
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <Icon
              name={secureText ? 'eye-off' : 'eye'}
              size={20}
              color={colors.placeholder}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => (authNavigation as any).navigate('ForgotPassword')}
          style={importedStyles.forgotPasswordBtn}>
          <Text style={importedStyles.forgotPasswordText}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
        {error && <Text style={importedStyles.error}>{error}</Text>}

        <Button
          title="Sign In"
          onPress={handleSignIn}
          loading={loading}
          style={{marginBottom: 20}}
        />

        <Text style={importedStyles.terms}>
          By continuing, you agree to our{' '}
          <Text style={importedStyles.link}>Terms of Service</Text> and{' '}
          <Text style={importedStyles.link}>Privacy Policy</Text>
        </Text>

        <Text style={importedStyles.footer}>
          Don't have an account?{' '}
          <Text
            style={importedStyles.link}
            onPress={() => navigation.navigate('Signup')}>
            Sign up
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
