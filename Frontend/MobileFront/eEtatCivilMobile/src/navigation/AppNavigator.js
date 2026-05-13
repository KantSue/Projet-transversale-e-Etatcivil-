import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Citoyen
import AccueilCitoyenScreen from '../screens/citoyen/AcceuilScreen';
import DemandeScreen from '../screens/citoyen/DemandeScreen';
import SuiviScreen from '../screens/citoyen/SuiviScreen';

// Agent
import FileAttenteScreen from '../screens/agent/FileAttenteScreen';
import DetailDemandeScreen from '../screens/agent/DetailDemandeScreen';
import RechercheScreen from '../screens/agent/RechercheScreen';

// Admin
import DashboardScreen from '../screens/admin/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [token, setToken] = useState(null);
  const [role, setRole]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      AsyncStorage.getItem('role').then(r => {
        setToken(t);
        setRole(r);
        setLoading(false);
      });
    });
  }, []);

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Non connecté
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : role?.toLowerCase() === 'citoyen' ? (
        // Citoyen
        <>
          <Stack.Screen name="AccueilCitoyen" component={AccueilCitoyenScreen} />
          <Stack.Screen name="Demande"        component={DemandeScreen} />
          <Stack.Screen name="Suivi"          component={SuiviScreen} />
        </>
      ) : role?.toLowerCase() === 'agent' ? (
        // Agent
        <>
          <Stack.Screen name="FileAttente"    component={FileAttenteScreen} />
          <Stack.Screen name="DetailDemande"  component={DetailDemandeScreen} />
          <Stack.Screen name="Recherche"      component={RechercheScreen} />
        </>
      ) : (
        // Admin
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}