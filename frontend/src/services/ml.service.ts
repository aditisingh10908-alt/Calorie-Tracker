import { api } from './api';
import { WeightPrediction, GoalPrediction, DeficitAnalysis, Recommendation } from '../types';

export class MlService {
  static async predictWeight(): Promise<WeightPrediction> {
    const response = await api.post('/ml/predict-weight');
    return response.data.data;
  }

  static async predictGoal(): Promise<GoalPrediction> {
    const response = await api.post('/ml/predict-goal');
    return response.data.data;
  }

  static async analyzeDeficit(): Promise<DeficitAnalysis> {
    const response = await api.post('/ml/analyze-deficit');
    return response.data.data;
  }

  static async getRecommendations(): Promise<Recommendation> {
    const response = await api.get('/ml/recommendations');
    return response.data.data;
  }
}
