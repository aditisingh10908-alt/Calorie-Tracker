import { api } from './api';
import { ProteinSummary } from '../types';

export class ProteinService {
  static async getDailyProtein(dateStr: string): Promise<ProteinSummary> {
    const response = await api.get(`/protein/daily?date=${dateStr}`);
    return response.data.data;
  }

  static async getProteinHistory(limit = 30): Promise<any[]> {
    const response = await api.get(`/protein/history?limit=${limit}`);
    return response.data.data;
  }
}
