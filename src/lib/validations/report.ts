import { z } from 'zod';

export const createReportSchema = z.object({
  type: z.enum([
    'CONSTRUCTION', 'TRAIL_CLOSED', 'OBSTACLE', 'POTHOLE',
    'DANGEROUS_GRAVEL', 'MUD', 'ICE', 'SNOW',
    'WATER_ACCUMULATION', 'FALLEN_TREE', 'POOR_SIGNAGE',
    'ACCIDENT', 'ROAD_HAZARD', 'POOR_LIGHTING',
    'UNSAFE_AREA', 'HEAVY_TRAFFIC', 'ANIMALS', 'OTHER',
  ], { required_error: 'Le type de signalement est requis' }),
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(120, 'Le titre ne peut pas dépasser 120 caractères')
    .trim(),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .trim()
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  trail_id: z.string().uuid('ID de piste invalide').nullable().optional(),
  image_uri: z.string().optional(),   // URI locale de l'image (avant upload)
});

export const reportCommentSchema = z.object({
  content: z
    .string()
    .min(2, 'Commentaire trop court')
    .max(300, 'Commentaire trop long (max 300 caractères)')
    .trim(),
});

export type CreateReportFormData = z.infer<typeof createReportSchema>;
export type ReportCommentFormData = z.infer<typeof reportCommentSchema>;
