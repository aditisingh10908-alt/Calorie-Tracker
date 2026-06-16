import { api } from './api';
import { DailyWaterSummary, WaterLog } from '../types';

export class WaterService {
  static async logWater(amount: number, date: string, time?: string): Promise<WaterLog> {
    const response = await api.post('/water', { amount, date, time });
    return response.data.data;
  }

  static async getDailyWater(dateStr: string): Promise<DailyWaterSummary> {
    const response = await api.get(`/water/daily?date=${dateStr}`);
    return response.data.data;
  }

  static async getWaterHistory(limit = 30): Promise<any[]> {
    const response = await api.get(`/water/history?limit=${limit}`);
    return response.data.data;
  }

  static async deleteWaterLog(id: string): Promise<void> {
    await api.delete(`/water/${id}`);
  }
}
