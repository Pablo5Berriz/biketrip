import React, { useState } from 'react';
import {
  View, Text, TextInput,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

// ============================================================
// AppInput — Champ de saisie BikeTrip
// ============================================================

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function AppInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  ...props
}: AppInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-semibold text-carbon">{label}</Text>
      )}

      <View
        className={`flex-row items-center bg-white rounded-xl border px-4 ${
          error
            ? 'border-danger'
            : 'border-border focus-within:border-primary-600'
        }`}
        style={{ minHeight: 52 }}
      >
        {leftIcon && (
          <View className="mr-3">{leftIcon}</View>
        )}

        <TextInput
          className="flex-1 text-base text-carbon py-3"
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword
              ? <EyeOff size={20} color="#64748B" />
              : <Eye size={20} color="#64748B" />
            }
          </TouchableOpacity>
        ) : rightIcon ? (
          <View className="ml-3">{rightIcon}</View>
        ) : null}
      </View>

      {error && (
        <Text className="text-xs text-danger">{error}</Text>
      )}
      {hint && !error && (
        <Text className="text-xs text-slate">{hint}</Text>
      )}
    </View>
  );
}
