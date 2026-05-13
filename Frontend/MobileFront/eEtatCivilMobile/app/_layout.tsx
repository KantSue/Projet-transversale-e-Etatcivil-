import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';


export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="citoyen/accueil" />
      <Stack.Screen name="citoyen/demande" />
      <Stack.Screen name="citoyen/suivi" />
      <Stack.Screen name="agent/file-attente" />
      <Stack.Screen name="agent/detail-demande" />
      <Stack.Screen name="agent/recherche" />
      <Stack.Screen name="admin/dashboard" />
      <Stack.Screen name="archives" />
      <Stack.Screen name="agent/historique" />
      <Stack.Screen name="citoyen/arrondissements" />
      <Stack.Screen name="profil" />
      <Stack.Screen name="mot-de-passe-oublie" />
    </Stack>
  );
}