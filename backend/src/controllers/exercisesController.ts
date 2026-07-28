import { Request, Response } from 'express';
import { IExerciseRepository } from '../repositories/exerciseRepository';
import { SearchQuerySchema } from '../schemas/search.schema';

export class ExercisesController {
  constructor(private exerciseRepository: IExerciseRepository) {}

  /** GET /api/exercises/search?q=press&equipment=gym&limit=20 */
  public search = async (req: Request, res: Response): Promise<void> => {
    const result = SearchQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: 'Parámetros de búsqueda inválidos' });
      return;
    }
    const { q, equipment, limit } = result.data;
    try {
      const exercises = await this.exerciseRepository.search(q, { equipment, limit });
      res.json(exercises);
    } catch (error) {
      console.error('Error en búsqueda de ejercicios:', error);
      res.status(500).json({ error: 'Error interno al buscar ejercicios' });
    }
  };
}
