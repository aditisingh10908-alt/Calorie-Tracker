import { api } from './api';
import { Food } from '../types';

export class FoodService {
  static async getFoods(page = 1, limit = 20): Promise<any> {
    const response = await api.get(`/foods?page=${page}&limit=${limit}`);
    return response.data.data;
  }

  static async searchFoods(query: string): Promise<Food[]> {
    const response = await api.get(`/foods/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  }

  static async getRecommendations(mealType?: string): Promise<Food[]> {
    const response = await api.get(`/foods/recommendations${mealType ? `?mealType=${mealType}` : ''}`);
    return response.data.data;
  }

  static async getFavorites(): Promise<Food[]> {
    const response = await api.get('/foods/favorites');
    return response.data.data;
  }

  static async toggleFavorite(id: string): Promise<any> {
    const response = await api.post(`/foods/${id}/favorite`);
    return response.data.data;
  }

  static async createCustomFood(data: any): Promise<Food> {
    const response = await api.post('/foods', data);
    return response.data.data;
  }

  static async updateCustomFood(id: string, data: any): Promise<Food> {
    const response = await api.put(`/foods/${id}`, data);
    return response.data.data;
  }

  static async deleteCustomFood(id: string): Promise<void> {
    await api.delete(`/foods/${id}`);
  }
}
