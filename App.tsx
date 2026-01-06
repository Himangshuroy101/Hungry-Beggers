import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../HungryBegger/lib/supabase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import LoginScreen from '../HungryBegger/screens/LoginScreens';
import MenuScreen from '../HungryBegger/screens/MenuScreens';
import SummaryScreen from '../HungryBegger/screens/SummaryScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileScreen from './screens/ProfileScreen';
import ManageMenuScreen from './screens/ManageMenuScreen';
import HistoryScreen from './screens/HistoryScreen';
import ChatScreen from './screens/ChatScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';


const Stack = createNativeStackNavigator();

const Tab = createBottomTabNavigator();


// 1. Create a "HomeTabs" component for your main app
function HomeTabs() {
  // Access the same isAdmin logic if needed, but only for visible tabs
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'Menu') iconName = 'fast-food';
          else if (route.name === 'Summary') iconName = 'list';
          else if (route.name === 'Chat') iconName = 'chatbubbles';
          else if (route.name === 'History') iconName = 'time';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6347',
        tabBarInactiveTintColor: 'gray',
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: 'Order Food' }} />
      <Tab.Screen name="Summary" component={SummaryScreen} options={{ title: 'Store List' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Discussion' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Debts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
      // This event triggers when the user clicks the Reset Link
      // You can now navigate them to your ResetPassword screen
      console.log("User clicked reset link, redirecting...");
      
      // navigation.navigate('ResetPassword'); // If using a navigation ref
    }
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

 

  if (!session) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // If logged in, show the Tab Navigator

   // Inside your App component, check the session user
  const userEmail = session?.user?.email;
  const isAdmin = userEmail === 'himangshuroy05@gmail.com';
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Main App with Tabs */}
        <Stack.Screen 
          name="HomeTabs" 
          component={HomeTabs} 
          options={{ headerShown: false }} 
        />
        
        {/* Admin Screens (No Bottom Bar here!) */}
        {isAdmin && (
          <Stack.Screen 
            name="Manage" 
            component={ManageMenuScreen} 
            options={{ title: 'Manage Menu' }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}