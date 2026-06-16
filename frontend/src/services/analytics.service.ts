import { api } from './api';

export class AnalyticsService {
  static async getWeeklyReport(): Promise<any> {
    const response = await api.get('/analytics/weekly');
    return response.data.data;
  }

  static async getMonthlyReport(): Promise<any> {
    const response = await api.get('/analytics/monthly');
    return response.data.data;
  }

  static async getTrends(): Promise<any> {
    const response = await api.get('/analytics/trends');
    return response.data.data;
  }
}
