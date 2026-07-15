import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors } from '@/config/colors';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Chargement...', fullScreen = false }: LoadingStateProps) {
  return (
    <View
      className={`items-center justify-center gap-3 ${fullScreen ? 'flex-1' : 'py-12'}`}
    >
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      <Text className="text-sm text-slate">{message}</Text>
    </View>
  );
}
