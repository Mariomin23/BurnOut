import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().min(2).max(60),
  equipment: z.enum(['gym', 'none']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
