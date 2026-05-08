import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères')
    .trim()
    .optional(),
  city: z
    .string()
    .max(100, 'Ville trop longue')
    .trim()
    .optional(),
  cycling_level: z.enum(['BEGINNER', 'CASUAL', 'REGULAR', 'SPORT', 'EXPERT']).optional(),
  primary_bike_type: z.enum(['ROAD', 'HYBRID', 'MOUNTAIN', 'GRAVEL', 'ELECTRIC', 'CARGO', 'URBAN', 'OTHER']).optional(),
  preferred_surface: z.enum(['ASPHALT', 'GRAVEL', 'DIRT', 'MIXED', 'UNKNOWN']).nullable().optional(),
  comfortable_distance_km: z
    .number()
    .int()
    .min(1, 'Distance minimum 1 km')
    .max(500, 'Distance maximum 500 km')
    .optional(),
  unit_system: z.enum(['METRIC', 'IMPERIAL']).optional(),
  is_private: z.boolean().optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
