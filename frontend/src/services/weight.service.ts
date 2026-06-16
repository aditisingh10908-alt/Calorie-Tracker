import { api } from './api';
import { WeightLog } from '../types';

export class WeightService {
  static async logWeight(weight: number, date: string, note?: string): Promise<WeightLog> {
    const response = await api.post('/weight', { weight, date, note });
    return response.data.data;
  }

  static async getWeightHistory(limit = 30): Promise<WeightLog[]> {
    const response = await api.get(`/weight/history?limit=${limit}`);
    return response.data.data;
  }

  static async getLatestWeight(): Promise<WeightLog | null> {
    const response = await api.get('/weight/latest');
    return response.data.data;
  }

  static async deleteWeightLog(id: string): Promise<void> {
    await api.delete(`/weight/${id}`);
  }
}
