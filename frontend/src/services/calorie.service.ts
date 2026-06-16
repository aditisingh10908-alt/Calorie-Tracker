import { api } from './api';
import { CalorieSummary } from '../types';

export class CalorieService {
  static async getDailySummary(dateStr: string): Promise<CalorieSummary> {
    const response = await api.get(`/calories/summary?date=${dateStr}`);
    return response.data.data;
  }

  static async getTDEECalculations(): Promise<any> {
    const response = await api.get('/calories/tdee');
    return response.data.data;
  }
}
