import { api } from './api';

export class UserService {
  static async getProfile(): Promise<any> {
    const response = await api.get('/users/profile');
    return response.data.data;
  }

  static async updateProfile(data: {
    name?: string;
    age?: number | null;
    gender?: string | null;
    height?: number | null;
    currentWeight?: number | null;
    goalWeight?: number | null;
    activityLevel?: string | null;
  }): Promise<any> {
    const response = await api.put('/users/profile', data);
    return response.data.data;
  }
}
