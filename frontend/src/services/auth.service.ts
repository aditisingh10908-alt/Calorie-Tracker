import { api } from './api';
import Cookies from 'js-cookie';

export class AuthService {
  static async login(data: any): Promise<any> {
    const response = await api.post('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data.data;
    
    // Store tokens in cookies
    Cookies.set('accessToken', accessToken, { expires: 7 });
    Cookies.set('refreshToken', refreshToken, { expires: 30 });
    
    return user;
  }

  static async register(data: any): Promise<any> {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data.data;

    Cookies.set('accessToken', accessToken, { expires: 7 });
    Cookies.set('refreshToken', refreshToken, { expires: 30 });

    return user;
  }

  static async forgotPassword(email: string): Promise<any> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  static async resetPassword(data: any): Promise<any> {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }

  static logout(): void {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  }

  static isAuthenticated(): boolean {
    return !!Cookies.get('accessToken');
  }
}
