import { prisma } from '../utils/prisma';

export class FoodService {
  static async createFood(userId: string, data: any): Promise<any> {
    return await prisma.food.create({
      data: {
        ...data,
        isDefault: false,
        createdById: userId,
      },
    });
  }

  static async getAllFoods(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;

    // Retrieve default foods AND custom foods created by this user
    const [foods, total] = await prisma.$transaction([
      prisma.food.findMany({
        where: {
          deletedAt: null,
          OR: [
            { isDefault: true },
            { createdById: userId },
          ],
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          favoriteFoods: {
            where: { userId },
          },
        },
      }),
      prisma.food.count({
        where: {
          deletedAt: null,
          OR: [
            { isDefault: true },
            { createdById: userId },
          ],
        },
      }),
    ]);

    // Format to include isFavorite boolean flag
    const formattedFoods = foods.map((food) => {
      const { favoriteFoods, ...foodData } = food;
      return {
        ...foodData,
        isFavorite: favoriteFoods.length > 0,
      };
    });

    return {
      data: formattedFoods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async searchFoods(userId: string, query: string): Promise<any[]> {
    if (!query) return [];

    const foods = await prisma.food.findMany({
      where: {
        deletedAt: null,
        name: {
          contains: query,
          mode: 'insensitive',
        },
        OR: [
          { isDefault: true },
          { createdById: userId },
        ],
      },
      take: 20,
      include: {
        favoriteFoods: {
          where: { userId },
        },
      },
    });

    return foods.map((food) => {
      const { favoriteFoods, ...foodData } = food;
      return {
        ...foodData,
        isFavorite: favoriteFoods.length > 0,
      };
    });
  }

  static async getFoodById(userId: string, id: string): Promise<any> {
    const food = await prisma.food.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { isDefault: true },
          { createdById: userId },
        ],
      },
      include: {
        favoriteFoods: {
          where: { userId },
        },
      },
    });

    if (!food) {
      throw { statusCode: 404, message: 'Food not found' };
    }

    const { favoriteFoods, ...foodData } = food;
    return {
      ...foodData,
      isFavorite: favoriteFoods.length > 0,
    };
  }

  static async updateFood(userId: string, id: string, data: any): Promise<any> {
    const food = await prisma.food.findFirst({
      where: { id, createdById: userId, deletedAt: null },
    });

    if (!food) {
      throw { statusCode: 404, message: 'Food not found or access denied (cannot edit system default foods)' };
    }

    return await prisma.food.update({
      where: { id },
      data,
    });
  }

  static async deleteFood(userId: string, id: string): Promise<void> {
    const food = await prisma.food.findFirst({
      where: { id, createdById: userId, deletedAt: null },
    });

    if (!food) {
      throw { statusCode: 404, message: 'Food not found or access denied' };
    }

    await prisma.food.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static async toggleFavorite(userId: string, foodId: string): Promise<any> {
    // Check if food exists
    const food = await prisma.food.findFirst({
      where: {
        id: foodId,
        deletedAt: null,
        OR: [
          { isDefault: true },
          { createdById: userId },
        ],
      },
    });

    if (!food) {
      throw { statusCode: 404, message: 'Food not found' };
    }

    const favorite = await prisma.favoriteFood.findUnique({
      where: {
        userId_foodId: {
          userId,
          foodId,
        },
      },
    });

    if (favorite) {
      await prisma.favoriteFood.delete({
        where: { id: favorite.id },
      });
      return { isFavorite: false };
    } else {
      await prisma.favoriteFood.create({
        data: {
          userId,
          foodId,
        },
      });
      return { isFavorite: true };
    }
  }

  static async getFavorites(userId: string): Promise<any[]> {
    const favorites = await prisma.favoriteFood.findMany({
      where: { userId },
      include: {
        food: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites
      .filter((fav) => fav.food.deletedAt === null)
      .map((fav) => ({
        ...fav.food,
        isFavorite: true,
      }));
  }

  static async getRecommendedFoods(userId: string, mealType?: string): Promise<any[]> {
    let currentMealType = mealType;
    if (!currentMealType) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) currentMealType = 'BREAKFAST';
      else if (hour >= 11 && hour < 16) currentMealType = 'LUNCH';
      else if (hour >= 16 && hour < 19) currentMealType = 'SNACK';
      else if (hour >= 19 && hour < 23) currentMealType = 'DINNER';
      else currentMealType = 'SNACK';
    }

    // Retrieve the last 100 meal logs of the user to extract history
    const userMeals = await prisma.meal.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            food: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 100,
    });

    const foodMap = new Map<string, any>();
    const frequencyMap = new Map<string, number>();
    const mealTypeCountMap = new Map<string, number>();
    const recencyIndexMap = new Map<string, number>(); // Stores the first index it appears at (lower index = more recent)

    let index = 0;
    userMeals.forEach((meal) => {
      const isTargetMealType = meal.mealType === currentMealType;
      meal.items.forEach((item) => {
        const food = item.food;
        if (food && food.deletedAt === null) {
          foodMap.set(food.id, food);

          // Track frequency
          frequencyMap.set(food.id, (frequencyMap.get(food.id) || 0) + 1);

          // Track meal type specific count
          if (isTargetMealType) {
            mealTypeCountMap.set(food.id, (mealTypeCountMap.get(food.id) || 0) + 1);
          }

          // Track recency
          if (!recencyIndexMap.has(food.id)) {
            recencyIndexMap.set(food.id, index);
          }
        }
      });
      index++;
    });

    // Score foods
    const scoredFoods = Array.from(foodMap.keys()).map((foodId) => {
      const food = foodMap.get(foodId)!;
      const freq = frequencyMap.get(foodId) || 0;
      const mealFreq = mealTypeCountMap.get(foodId) || 0;
      const recencyIdx = recencyIndexMap.get(foodId) ?? 999;

      // Score formula:
      // - 3 points per total log frequency
      // - 5 points per target meal type log frequency
      // - Recency bonus: (100 - recencyIdx) * 0.5 (max 50 points if most recent)
      const score = freq * 3.0 + mealFreq * 5.0 + Math.max(0, 100 - recencyIdx) * 0.5;

      return { food, score };
    });

    // Sort by score descending
    scoredFoods.sort((a, b) => b.score - a.score);

    // Get the favorites to populate isFavorite flag
    const favorites = await prisma.favoriteFood.findMany({
      where: { userId },
      select: { foodId: true },
    });
    const favoriteSet = new Set(favorites.map((f) => f.foodId));

    let recommended = scoredFoods.map((sf) => ({
      ...sf.food,
      isFavorite: favoriteSet.has(sf.food.id),
    }));

    // If we have fewer than 6 recommendations, pad with popular defaults
    if (recommended.length < 6) {
      const existingIds = new Set(recommended.map((r) => r.id));

      const popularFoods = await prisma.food.findMany({
        where: {
          deletedAt: null,
          isDefault: true,
          OR: [
            { name: { contains: 'Roti (Wheat)', mode: 'insensitive' } },
            { name: { contains: 'Rice', mode: 'insensitive' } },
            { name: { contains: 'Dal', mode: 'insensitive' } },
            { name: { contains: 'Paneer Tikka', mode: 'insensitive' } },
            { name: { contains: 'Banana', mode: 'insensitive' } },
            { name: { contains: 'Milk', mode: 'insensitive' } },
          ],
          NOT: {
            id: { in: Array.from(existingIds) },
          },
        },
        take: 6 - recommended.length,
      });

      const padded = popularFoods.map((food) => ({
        ...food,
        isFavorite: favoriteSet.has(food.id),
      }));

      recommended = [...recommended, ...padded];
    }

    return recommended.slice(0, 6);
  }
}

