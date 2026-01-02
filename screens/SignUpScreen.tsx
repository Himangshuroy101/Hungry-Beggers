import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(false);

//   async function handleSignUp() {
//     if (!email || !password || !fullName) {
//       Alert.alert("Error", "Please fill in all required fields.");
//       return;
//     }

//     setLoading(true);
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           full_name: fullName,
//           designation: designation,
//         },
//       },
//     });

//     setLoading(false);

//     if (error) {
//       console.error(error);
//       Alert.alert("Sign Up Failed", error.message);
//     } else {
//       Alert.alert(
//         "Verification Sent!", 
//         "Please check your email and click the verification link to complete your registration.",
//         [{ text: "OK", onPress: () => navigation.navigate('Login') }]
//       );
//     }
//   }

async function handleSignUp() {
  if (!email || !password || !fullName) {
    Alert.alert("Error", "Please fill in Name, Email, and Password.");
    return;
  }

  setLoading(true);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        designation: designation,
      },
    },
  });

  setLoading(false);

  if (error) {
    Alert.alert("Sign Up Failed", error.message);
  } else if (data.session) {
    // This will trigger if "Confirm Email" is OFF
    Alert.alert("Success!", "Account created. You are now logged in!");
    // App.tsx will detect the session and switch to the Menu automatically
  } else {
    Alert.alert("Check Email", "Please verify your email to continue.");
  }
}

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Join the Food Club 🥗</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        value={fullName} 
        onChangeText={setFullName}
      />

      <TextInput 
        style={styles.input} 
        placeholder="Designation (e.g. Developer, HR)" 
        value={designation} 
        onChangeText={setDesignation}
      />

      <TextInput 
        style={styles.input} 
        placeholder="Office Email" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#666', textAlign: 'center', marginTop: 20 }
});