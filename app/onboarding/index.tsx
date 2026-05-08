import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Dimensions, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  Map, CloudSun, Users, Zap,
} from 'lucide-react-native';
import { colors, gradients } from '@/config/colors';

const { width } = Dimensions.get('window');

// ============================================================
// Onboarding BikeTrip — 4 écrans
// ============================================================

const slides = [
  {
    icon: <Map size={64} color="white" />,
    gradient: [colors.primary.DEFAULT, colors.sky] as [string, string],
    title: 'Découvre les meilleures\npistes cyclables',
    description: 'Trouve les pistes adaptées à ton niveau, ton vélo et tes envies. Explore la carte et pars à l\'aventure.',
  },
  {
    icon: <CloudSun size={64} color="white" />,
    gradient: gradients.weather as [string, string],
    title: 'Prépare tes sorties avec\nmétéo et dénivelé',
    description: 'Consulte la météo en temps réel, le profil d\'élévation et reçois des conseils adaptés à chaque trajet.',
  },
  {
    icon: <Users size={64} color="white" />,
    gradient: [colors.accent.DEFAULT, '#FBBF24'] as [string, string],
    title: 'Roule mieux grâce aux\nsignalements communautaires',
    description: 'Les cyclistes signalent en temps réel les obstacles, travaux, verglas et dangers sur les pistes.',
  },
  {
    icon: <Zap size={64} color="white" />,
    gradient: gradients.elevation as [string, string],
    title: 'Reçois des conseils\nadaptés à ton trajet',
    description: 'BikeTrip analyse météo, dénivelé et signalements pour te donner les meilleurs conseils avant de partir.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function goNext() {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }
  }

  async function finish() {
    await SecureStore.setItemAsync('onboarding_done', 'true');
    router.replace('/auth/login');
  }

  const slide = slides[currentIndex]!;
  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: slide.gradient[0] }}>
      <LinearGradient
        colors={slide.gradient}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={{ flex: 1 }}
        >
          {slides.map((s, i) => (
            <View
              key={i}
              style={{ width }}
              className="flex-1 items-center justify-center px-8 gap-8"
            >
              {/* Icône */}
              <View className="w-32 h-32 rounded-full bg-white/20 items-center justify-center">
                {s.icon}
              </View>

              {/* Texte */}
              <View className="items-center gap-4">
                <Text
                  className="text-3xl font-black text-white text-center leading-9"
                  style={{ letterSpacing: -0.5 }}
                >
                  {s.title}
                </Text>
                <Text className="text-base text-white/85 text-center leading-6">
                  {s.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View className="px-6 pb-8 gap-6">
          {/* Indicateurs */}
          <View className="flex-row justify-center gap-2">
            {slides.map((_, i) => (
              <View
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === currentIndex ? 24 : 8,
                  backgroundColor: i === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>

          {/* Boutons */}
          {isLast ? (
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                className="bg-white rounded-2xl py-4 items-center"
                accessibilityRole="button"
                accessibilityLabel="Créer un compte"
              >
                <Text className="text-base font-bold text-primary-600">
                  Créer un compte
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={finish}
                className="py-3 items-center"
                accessibilityRole="button"
                accessibilityLabel="Se connecter avec un compte existant"
              >
                <Text className="text-white/85 text-base">
                  Déjà un compte ? Se connecter
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={finish}
                accessibilityRole="button"
                accessibilityLabel="Passer l'introduction"
              >
                <Text className="text-white/70 text-base">Passer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goNext}
                className="bg-white rounded-2xl px-8 py-4"
                accessibilityRole="button"
                accessibilityLabel="Afficher l'écran suivant"
              >
                <Text className="text-base font-bold" style={{ color: slide.gradient[0] }}>
                  Suivant
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
