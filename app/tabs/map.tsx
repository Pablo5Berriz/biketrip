import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, AlertTriangle, Plus,
  Navigation, Filter,
} from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { useMapStore } from '@/stores/mapStore';
import { getNearbyTrails } from '@/features/trails/trailService';
import { getNearbyReports } from '@/features/reports/reportService';
import { TrailCard } from '@/components/trails/TrailCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { DIFFICULTY_COLORS, REPORT_SEVERITY_COLORS } from '@/lib/constants/labels';
import { colors } from '@/config/colors';

// ============================================================
// Écran Carte — plein écran avec bottom sheet
// ============================================================

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { location } = useLocation();
  const { selectedTrailId, setSelectedTrailId, filters } = useMapStore();

  const trailsQuery = useQuery({
    queryKey: ['trails', 'nearby-map', location?.latitude, location?.longitude],
    queryFn: () => getNearbyTrails(location!.latitude, location!.longitude, 30),
    enabled: !!location,
  });

  const reportsQuery = useQuery({
    queryKey: ['reports', 'nearby-map', location?.latitude, location?.longitude],
    queryFn: () => getNearbyReports(location!.latitude, location!.longitude, 10),
    enabled: !!location && filters.showReports,
  });

  const centerOnUser = useCallback(() => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  }, [location]);

  const selectedTrail = (trailsQuery.data?.data ?? []).find(
    (t) => t.id === selectedTrailId,
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Carte plein écran */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={
          location
            ? {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }
            : {
              latitude: 46.8139,
              longitude: -71.2080,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }
        }
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {/* Marqueurs de pistes */}
        {(trailsQuery.data?.data ?? []).map((trail) => (
          <Marker
            key={trail.id}
            coordinate={{
              latitude: trail.start_latitude,
              longitude: trail.start_longitude,
            }}
            onPress={() => setSelectedTrailId(trail.id)}
          >
            <View
              className="rounded-full p-2 border-2 border-white"
              style={{
                backgroundColor:
                  selectedTrailId === trail.id
                    ? colors.primary.DEFAULT
                    : DIFFICULTY_COLORS[trail.difficulty],
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <MapPin size={16} color="white" />
            </View>
          </Marker>
        ))}

        {/* Marqueurs de signalements */}
        {filters.showReports && (reportsQuery.data?.data ?? []).map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            onPress={() => router.push(`/reports/${report.id}`)}
          >
            <View
              className="rounded-full p-1.5 border-2 border-white"
              style={{
                backgroundColor: REPORT_SEVERITY_COLORS[report.severity],
              }}
            >
              <AlertTriangle size={14} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Overlay contrôles */}
      <SafeAreaView
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        pointerEvents="box-none"
      >
        {/* Barre de recherche */}
        <View className="mx-4 mt-4">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/discover')}
            className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center gap-3 shadow-float"
          >
            <MapPin size={18} color={colors.textSecondary} />
            <Text className="text-slate text-base flex-1">Rechercher une piste...</Text>
            <Filter size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Boutons flottants droite */}
      <View
        style={{ position: 'absolute', right: 16, bottom: selectedTrail ? 260 : 100 }}
        className="gap-3"
      >
        <TouchableOpacity
          onPress={centerOnUser}
          className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-float"
        >
          <Navigation size={22} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/reports/new')}
          className="w-12 h-12 rounded-full items-center justify-center shadow-float"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          <Plus size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet — piste sélectionnée */}
      {selectedTrail && (
        <View
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          <View className="w-12 h-1 bg-border rounded-full self-center mb-4" />
          <TrailCard
            trail={selectedTrail}
            onPress={() => {
              setSelectedTrailId(null);
              router.push(`/trails/${selectedTrail.id}`);
            }}
            compact={false}
          />
          <TouchableOpacity
            onPress={() => setSelectedTrailId(null)}
            className="mt-3 py-2 items-center"
          >
            <Text className="text-slate text-sm">Fermer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {trailsQuery.isLoading && (
        <View
          style={{ position: 'absolute', bottom: 100, alignSelf: 'center' }}
          className="bg-white rounded-full px-4 py-2 shadow-float flex-row items-center gap-2"
        >
          <LoadingState message="Chargement des pistes..." />
        </View>
      )}
    </View>
  );
}
