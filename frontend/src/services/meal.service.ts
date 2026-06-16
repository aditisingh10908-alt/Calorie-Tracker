import { api } from './api';
import { DailyMealSummary, Meal } from '../types';

export class MealService {
  static async logMeal(data: any): Promise<Meal> {
    const response = await api.post('/meals', data);
    return response.data.data;
  }

  static async getMealsByDate(dateStr: string): Promise<DailyMealSummary> {
    const response = await api.get(`/meals?date=${dateStr}`);
    return response.data.data;
  }

  static async updateMeal(id: string, data: any): Promise<Meal> {
    const response = await api.put(`/meals/${id}`, data);
    return response.data.data;
  }

  static async deleteMeal(id: string): Promise<void> {
    await api.delete(`/meals/${id}`);
  }
}
