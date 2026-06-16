import { api } from './api';
import { Streak } from '../types';

export class StreakService {
  static async getStreaks(): Promise<Streak[]> {
    const response = await api.get('/streaks');
    return response.data.data;
  }
}
