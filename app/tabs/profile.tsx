import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Settings, Heart, Star, Shield,
  ChevronRight, LogOut, Activity,
  Camera, Award, MapPin,
} from 'lucide-react-native';
import { useProfile, useIsAuthenticated, useUser } from '@/stores/authStore';
import { getRideStats } from '@/features/rides/rideService';
import { signOut } from '@/features/auth/authService';
import { formatDistance } from '@/lib/geo/geoUtils';
import { CYCLING_LEVEL_LABELS, BIKE_TYPE_LABELS } from '@/lib/constants/labels';
import { colors } from '@/config/colors';

// ============================================================
// Écran Profil
// ============================================================

export default function ProfileScreen() {
  const isAuthenticated = useIsAuthenticated();
  const profile = useProfile();
  const user = useUser();

  const statsQuery = useQuery({
    queryKey: ['rides', 'stats'],
    queryFn: () => getRideStats(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  const stats = statsQuery.data?.data;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="px-5 pt-5 pb-3">
          <Text className="text-2xl font-black text-carbon">Profil</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <View className="w-20 h-20 bg-primary-600/10 rounded-full items-center justify-center">
            <Activity size={36} color={colors.primary.DEFAULT} />
          </View>
          <Text className="text-xl font-bold text-carbon text-center">
            Rejoins la communauté BikeTrip
          </Text>
          <Text className="text-slate text-base text-center leading-6">
            Connecte-toi pour accéder à ton profil, tes favoris et ton historique de sorties.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="w-full bg-primary-600 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text className="text-primary-600 text-sm font-semibold">
              Créer un compte →
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Cycliste';
  const avatarUrl = profile?.avatar_url;
  const totalRides = stats?.totalRides ?? 0;
  const totalDistance = stats?.totalDistanceKm ?? 0;

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/login');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header profil */}
        <View className="px-5 pt-5 pb-6 items-center gap-4">
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/settings/index')}
            className="relative"
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 88, height: 88, borderRadius: 44 }}
              />
            ) : (
              <View
                className="w-22 h-22 rounded-full items-center justify-center"
                style={{
                  width: 88, height: 88, borderRadius: 44,
                  backgroundColor: colors.primary.DEFAULT,
                }}
              >
                <Text style={{ fontSize: 32, color: 'white', fontWeight: '700' }}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Camera size={12} color="white" />
            </View>
          </TouchableOpacity>

          <View className="items-center gap-1">
            <Text className="text-xl font-black text-carbon">{profile?.full_name ?? firstName}</Text>
            <Text className="text-sm text-slate">{user?.email}</Text>
            {profile?.cycling_level && (
              <View className="flex-row items-center gap-1 mt-1 bg-primary-600/10 rounded-full px-3 py-1">
                <Award size={12} color={colors.primary.DEFAULT} />
                <Text className="text-xs text-primary-600 font-semibold">
                  {CYCLING_LEVEL_LABELS[profile.cycling_level]}
                </Text>
              </View>
            )}
          </View>

          {/* Mini stats */}
          <View className="flex-row bg-white rounded-2xl border border-border w-full">
            <View className="flex-1 items-center py-4 gap-1">
              <Text className="text-xl font-black text-carbon">{totalRides}</Text>
              <Text className="text-xs text-slate">Sorties</Text>
            </View>
            <View className="w-px bg-border self-stretch" />
            <View className="flex-1 items-center py-4 gap-1">
              <Text className="text-xl font-black text-carbon">{formatDistance(totalDistance)}</Text>
              <Text className="text-xs text-slate">Parcourus</Text>
            </View>
            <View className="w-px bg-border self-stretch" />
            <View className="flex-1 items-center py-4 gap-1">
              <Text className="text-xl font-black text-carbon">
                {profile?.primary_bike_type ? BIKE_TYPE_LABELS[profile.primary_bike_type] : '—'}
              </Text>
              <Text className="text-xs text-slate">Vélo</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        <View className="px-5 gap-4">

          {/* Mon activité */}
          <SectionBlock title="Mon activité">
            <MenuRow
              icon={<Activity size={18} color={colors.primary.DEFAULT} />}
              label="Mes sorties"
              sublabel={`${totalRides} sortie${totalRides > 1 ? 's' : ''}`}
              onPress={() => router.push('/(tabs)/rides')}
              iconBg={`${colors.primary.DEFAULT}18`}
            />
            <MenuRow
              icon={<Heart size={18} color={colors.accent.DEFAULT} />}
              label="Mes favoris"
              onPress={() => router.push('/favorites/index')}
              iconBg={`${colors.accent.DEFAULT}18`}
            />
            <MenuRow
              icon={<Star size={18} color="#F59E0B" />}
              label="Mes collections"
              onPress={() => router.push('/collections/index')}
              iconBg="#F59E0B18"
              isLast
            />
          </SectionBlock>

          {/* Compte */}
          <SectionBlock title="Compte">
            <MenuRow
              icon={<Settings size={18} color={colors.textSecondary} />}
              label="Paramètres"
              sublabel="Profil, vélo, notifications..."
              onPress={() => router.push('/settings/index')}
              iconBg="#94A3B818"
            />
            {profile?.role === 'ADMIN' || profile?.role === 'MODERATOR' ? (
              <MenuRow
                icon={<Shield size={18} color={colors.elevation} />}
                label="Administration"
                onPress={() => router.push('/admin/index')}
                iconBg={`${colors.elevation}18`}
              />
            ) : null}
            <MenuRow
              icon={<MapPin size={18} color={colors.sky} />}
              label="Mes signalements"
              onPress={() => router.push('/reports/mine')}
              iconBg={`${colors.sky}18`}
              isLast
            />
          </SectionBlock>

          {/* Déconnexion */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-white rounded-2xl border border-danger/30 p-4 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl items-center justify-center bg-danger/10">
                <LogOut size={18} color={colors.danger} />
              </View>
              <Text className="text-danger font-semibold text-base">Se déconnecter</Text>
            </View>
          </TouchableOpacity>

          <Text className="text-center text-xs text-slate mt-2">
            BikeTrip v1.0.0 · Fait avec ♥ pour les cyclistes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Composants internes ─────────────────────────────────────

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-xs font-semibold text-slate uppercase tracking-widest mb-2 px-1">
        {title}
      </Text>
      <View className="bg-white rounded-2xl border border-border overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function MenuRow({
  icon, label, sublabel, onPress, iconBg, isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  iconBg?: string;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 gap-3 ${!isLast ? 'border-b border-border' : ''}`}
      activeOpacity={0.7}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: iconBg ?? '#F4F8F5' }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-carbon font-medium">{label}</Text>
        {sublabel && <Text className="text-xs text-slate mt-0.5">{sublabel}</Text>}
      </View>
      <ChevronRight size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
