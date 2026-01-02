import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<{name: string, email: string, designation: string} | null>(null);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setProfile({
        name: user.user_metadata?.full_name || 'No Name',
        email: user.email || '',
        designation: user.user_metadata?.designation || 'No Designation',
      });
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  };

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
           <Ionicons name="person-circle" size={100} color="#ff6347" />
        </View>
        
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.designation}>{profile.designation}</Text>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{profile.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{marginRight: 10}} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerBackground: { height: 150, backgroundColor: '#ff6347', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: -60, borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  avatarContainer: { marginBottom: 15 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  designation: { fontSize: 16, color: '#ff6347', fontWeight: '600', marginBottom: 20 },
  infoSection: { width: '100%', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20, marginBottom: 30 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  infoText: { marginLeft: 10, fontSize: 16, color: '#666' },
  signOutButton: { flexDirection: 'row', backgroundColor: '#ff4d4d', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center' },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});