import React from 'react';
import { View, Text } from 'react-native';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16 px-8 gap-4">
      {icon && (
        <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-2">
          {icon}
        </View>
      )}
      <Text className="text-xl font-bold text-carbon text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-slate text-center leading-5">{description}</Text>
      )}
      {actionLabel && onAction && (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          className="mt-2"
        />
      )}
    </View>
  );
}
