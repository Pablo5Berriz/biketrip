import { z } from 'zod';

export const rideNotesSchema = z.object({
  title: z
    .string()
    .max(100, 'Titre trop long (max 100 caractères)')
    .trim()
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes trop longues (max 1000 caractères)')
    .trim()
    .optional(),
});

export const plannedRideSchema = z.object({
  trail_id: z.string().uuid('ID de piste invalide'),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (AAAA-MM-JJ)'),
  planned_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format d\'heure invalide (HH:MM)')
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes trop longues (max 500 caractères)')
    .trim()
    .optional(),
});

export const collectionSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères')
    .trim(),
  description: z
    .string()
    .max(300, 'Description trop longue (max 300 caractères)')
    .trim()
    .nullable()
    .optional(),
});

export type RideNotesFormData = z.infer<typeof rideNotesSchema>;
export type PlannedRideFormData = z.infer<typeof plannedRideSchema>;
export type CollectionFormData = z.infer<typeof collectionSchema>;
