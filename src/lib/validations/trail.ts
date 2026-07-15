import { z } from 'zod';

export const trailReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Note minimum : 1')
    .max(5, 'Note maximum : 5'),
  comment: z
    .string()
    .max(800, 'Commentaire trop long (max 800 caractères)')
    .trim()
    .optional(),
});

export const trailFilterSchema = z.object({
  difficulty: z.enum(['EASY', 'MODERATE', 'HARD', 'EXPERT']).optional(),
  surface_type: z.enum(['ASPHALT', 'GRAVEL', 'DIRT', 'MIXED', 'UNKNOWN']).optional(),
  trail_type: z.enum([
    'URBAN', 'NATURE', 'GREENWAY', 'FAMILY', 'SPORT',
    'SHARED_ROAD', 'GRAVEL', 'LONG_DISTANCE', 'TOURISM',
  ]).optional(),
  min_distance_km: z.number().min(0).optional(),
  max_distance_km: z.number().min(0).optional(),
  bike_type: z.enum(['ROAD', 'HYBRID', 'MOUNTAIN', 'GRAVEL', 'ELECTRIC', 'CARGO', 'URBAN', 'OTHER']).optional(),
  query: z.string().trim().optional(),
});

export type TrailReviewFormData = z.infer<typeof trailReviewSchema>;
export type TrailFilterFormData = z.infer<typeof trailFilterSchema>;
