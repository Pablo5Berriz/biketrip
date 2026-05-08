import React from 'react';
import { View, TouchableOpacity, type ViewProps } from 'react-native';

// ============================================================
// AppCard — Carte BikeTrip
// ============================================================

interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
};

export function AppCard({
  children,
  onPress,
  elevated = false,
  padding = 'md',
  className = '',
  ...props
}: AppCardProps) {
  const baseClass = `bg-white rounded-2xl ${paddingClasses[padding]} ${
    elevated
      ? 'shadow-lg'
      : 'shadow-sm border border-border'
  } ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        className={baseClass}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClass} {...props}>
      {children}
    </View>
  );
}
