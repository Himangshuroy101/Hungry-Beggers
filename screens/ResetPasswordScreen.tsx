
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';



export default function ResetPasswordScreen({ navigation }: any) {
  const [newPassword, setNewPassword] = useState('');

  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", "Password updated!");
      navigation.navigate('Login');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Password 🔑</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Enter new password"
        placeholderTextColor="#888" 
        secureTextEntry 
        value={newPassword} 
        onChangeText={setNewPassword} 
      />
      <TouchableOpacity style={styles.button} onPress={updatePassword}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
    title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
    input: {    
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
    button: {
    backgroundColor: '#ff6347',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
    buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

});