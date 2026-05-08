import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  type TouchableOpacityProps, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/config/colors';

// ============================================================
// AppButton — Bouton principal BikeTrip
// ============================================================

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600 active:bg-primary-700',
  secondary: 'bg-secondary-600 active:bg-secondary-700',
  accent:    'bg-accent-500 active:bg-accent-600',
  ghost:     'bg-transparent border border-border active:bg-slate/10',
  danger:    'bg-danger active:bg-red-700',
  gradient:  '',  // géré séparément
};

const textClasses: Record<ButtonVariant, string> = {
  primary:   'text-white',
  secondary: 'text-white',
  accent:    'text-white',
  ghost:     'text-carbon',
  danger:    'text-white',
  gradient:  'text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 rounded-xl',
  md: 'px-6 py-3.5 rounded-xl',
  lg: 'px-8 py-4 rounded-2xl',
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-lg font-bold',
};

const minHeights: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled,
  onPress,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const content = (
    <View className={`flex-row items-center justify-center gap-2`}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? '#111827' : '#FFFFFF'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            className={`${textSizeClasses[size]} ${textClasses[variant]}`}
            style={{ letterSpacing: 0.2 }}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={{
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
          minHeight: minHeights[size],
        }}
        {...rest}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: size === 'lg' ? 16 : 12 }}
          className={`${sizeClasses[size]} items-center justify-center`}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      className={`${variantClasses[variant]} ${sizeClasses[size]} items-center justify-center`}
      style={{
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled ? 0.5 : 1,
        minHeight: minHeights[size],
      }}
      {...rest}
    >
      {content}
    </TouchableOpacity>
  );
}
