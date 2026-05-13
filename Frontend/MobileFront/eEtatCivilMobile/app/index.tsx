import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'role']).then(values => {
      const token = values[0][1];
      const role  = values[1][1];

      if (!token) {
        router.replace('/login');
      } else if (role?.toLowerCase() === 'citoyen') {
        router.replace('/citoyen/acceuil');
      } else if (role?.toLowerCase() === 'agent') {
        router.replace('/agent/file_attente');
      } else {
        router.replace('/admin/dashboard');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1a5276" />
    </View>
  );
}