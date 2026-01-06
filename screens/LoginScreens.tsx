import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // async function handleSignIn() {
  //   setLoading(true);
  //   const { error } = await supabase.auth.signInWithPassword({ email, password });
  //   if (error) Alert.alert("Login Failed", error.message);
  //   setLoading(false);
  // }
 async function handleSignIn() {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    if (error.message.includes("Email not confirmed")) {
      Alert.alert("Verify Email", "You haven't clicked the link in your email yet!");
    } else {
      Alert.alert("Login Failed", error.message);
    }
  }
  setLoading(false);
}

// Inside handleForgotPassword function
async function handleForgotPassword() {
  if (!email) {
    Alert.alert("Error", "Please enter your office email first.");
    return;
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // This MUST match the Redirect URL in your Supabase Dashboard
    redirectTo: 'hungrybeggars://reset-password', 
  });

  if (error) {
    Alert.alert("Error", error.message);
  } else {
    Alert.alert("Email Sent 📧", "Check your inbox for the reset link.");
  }
}

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert("Sign Up", "Check your email for a confirmation link!");
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍕</Text>
      <Text style={styles.title}>Hungry Begger</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Office Email"
        placeholderTextColor="#888" 
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password"
        placeholderTextColor="#888" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>


      
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* UPDATE THIS BUTTON: Change it from handleSignUp to navigation.navigate */}
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  emoji: { fontSize: 50, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#ff6347', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#ff6347', textAlign: 'center', marginTop: 20 }
});