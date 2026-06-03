// screens/Profile.js
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, FlatList, ScrollView, StyleSheet, View} from 'react-native';
import {Asset} from 'react-native-image-picker';
import AccountOption from '@organisms/accountOptions';
import AppText from '@atoms/AppText';
import ImageUploader from '@molecules/imageUploader';
import Header from '@organisms/Header';
import {useAuth} from '../../providers/AuthProvider';
import {darkTheme, lightTheme} from '../../providers/Theme';
import {useTheme} from '../../providers/ThemeContext';
import {
  getUser as fetchUser,
  uploadProfilePicture,
} from '../../services/userService';
import {DeviceInfo, getDeviceInfo} from '../../utils/deviceInfo';
const Profile = ({navigation}: {navigation: any}) => {
  const {user, setUser} = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.photoUrl || '');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [selectedImage, setSelectedImage] = useState<Asset | undefined>(
    undefined,
  );
  const {theme} = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const accountOptionsData = [
    {
      icon: 'edit',
      label: 'Personal Information',
      onPress: () => navigation.navigate('EditPersonalInformation'),
      options: ['Edit Personal Information'],
    },
    {
      icon: 'list',
      label: 'Personal Expenses',
      onPress: () => navigation.navigate('ExpenseList'),
      options: ['Open Personal Expenses'],
    },
    {
      icon: 'plus-circle',
      label: 'Quick Add',
      onPress: () => navigation.navigate('QuickAddExpense'),
      options: ['Add Personal Expense'],
    },
    {
      icon: 'download',
      label: 'Reports & Export',
      onPress: () => navigation.navigate('ExportData'),
      options: ['Open Reports & Export'],
    },
    {
      icon: 'wallet',
      label: 'Monthly Budget',
      onPress: () => navigation.navigate('Action', {type: 'budget'}),
      options: ['Update Monthly Budget'],
    },
    {
      icon: 'trending-up',
      label: 'Monthly Income',
      onPress: () => navigation.navigate('Action', {type: 'income'}),
      options: ['Update Monthly Income'],
    },
    {
      icon: 'shield',
      label: 'Security & Privacy',
      onPress: () => navigation.navigate('UpdatePassword'),
      options: ['Change Password'],
    },
  ];
  const getUser = async () => {
    setLoading(true);
    try {
      const user = await fetchUser();
      setEmail(user.email);
      setName(user.name);
      setProfilePicture(user.profilePicture);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = async (image: Asset) => {
    setSelectedImage(image);
    try {
      const {url} = await uploadProfilePicture(image);
      setProfilePicture(url);
      // Update auth context so the Header image updates immediately
      setUser({...user, photoUrl: url});
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      Alert.alert(
        'Error',
        'Failed to upload profile picture. Please try again.',
      );
      setSelectedImage(undefined);
    }
  };

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      getUser();
    }
  }, []);

  useEffect(() => {
    getDeviceInfo().then(info => {
      if (info) {
        setDeviceInfo(info);
      }
    });
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          alignItems: 'center',
          paddingVertical: 20,
          backgroundColor: colors.background,
        },
        name: {
          marginTop: 16,
          textAlign: 'center',
        },
        email: {
          marginTop: 4,
          textAlign: 'center',
        },
        phone: {
          marginTop: 8,
          textAlign: 'center',
          color: colors.mutedText,
        },
        sectionTitle: {
          marginHorizontal: 20,
          marginTop: 12,
          marginBottom: 16,
        },
        versionSection: {
          marginTop: 32,
          alignItems: 'center',
        },
        madeBySection: {
          marginTop: 8,
          marginBottom: 24,
          alignItems: 'center',
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        showBackButton={navigation.canGoBack()}
        showDrawerButton={!navigation.canGoBack()}
        showImage={false}
      />
      <ScrollView
        contentContainerStyle={{paddingBottom: 12}}
        showsVerticalScrollIndicator={false}
        style={styles.container}>
        <View style={styles.header}>
          <ImageUploader
            onImageSelected={handleImageSelected}
            selectedImage={selectedImage}
            isProfilePic
            showUploadIcon
            profilePicture={profilePicture}
          />
          <AppText variant="h3" weight="bold" style={styles.name}>
            {user?.name || name}
          </AppText>
          <AppText variant="h6" color={colors.mutedText} style={styles.email}>
            {user?.email || email}
          </AppText>
          <AppText variant="lg" weight="medium" style={styles.phone}>
            {user?.phoneNumber}
          </AppText>
        </View>

        <AppText variant="h6" weight="semiBold" style={styles.sectionTitle}>
          Account & Tools
        </AppText>
        <FlatList
          data={accountOptionsData}
          scrollEnabled={false}
          renderItem={({item}) => (
            <AccountOption
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              options={item.options}
            />
          )}
          keyExtractor={item => item.label}
        />

        <View style={styles.versionSection}>
          <AppText variant="md" color={colors.mutedText}>
            {`v${deviceInfo?.versionName || ''} (${
              deviceInfo?.versionCode || ''
            })`}
          </AppText>
        </View>

        <View style={styles.madeBySection}>
          <AppText variant="sm" color={colors.mutedText}>
            Made with love by Rishabh Parsediya
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
