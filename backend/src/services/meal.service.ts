import { prisma } from '../utils/prisma';
import { MealType } from '@prisma/client';
import { StreakService } from './streak.service';
import { CalorieService } from './calorie.service';

export class MealService {
  static async createMeal(userId: string, data: any): Promise<any> {
    const { date, mealType, notes, items } = data;
    const mealDate = new Date(date);

    // Read details of all foods in the payload to calculate macros
    const foodIds = items.map((item: any) => item.foodId);
    const foods = await prisma.food.findMany({
      where: {
        id: { in: foodIds },
        deletedAt: null,
      },
    });

    const foodMap = new Map(foods.map((f) => [f.id, f]));

    // Calculate totals and format items
    let mealTotalCalories = 0;
    let mealTotalProtein = 0;
    let mealTotalCarbs = 0;
    let mealTotalFats = 0;

    const mealItemsToCreate = items.map((item: any) => {
      const food = foodMap.get(item.foodId);
      if (!food) {
        throw { statusCode: 400, message: `Food item with ID ${item.foodId} not found` };
      }

      // Quantity multiplier: item.quantity is relative to serving size
      const qty = item.quantity;
      const calories = food.calories * qty;
      const protein = food.protein * qty;
      const carbs = food.carbs * qty;
      const fats = food.fats * qty;

      mealTotalCalories += calories;
      mealTotalProtein += protein;
      mealTotalCarbs += carbs;
      mealTotalFats += fats;

      return {
        foodId: food.id,
        quantity: qty,
        calories,
        protein,
        carbs,
        fats,
      };
    });

    // Create meal and items inside transaction
    const meal = await prisma.$transaction(async (tx) => {
      const createdMeal = await tx.meal.create({
        data: {
          userId,
          date: mealDate,
          mealType: mealType as MealType,
          notes,
          items: {
            create: mealItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              food: true,
            },
          },
        },
      });

      return createdMeal;
    });

    // Fire-and-forget: Sync calorie log and streak
    try {
      await CalorieService.syncCalorieLog(userId, mealDate);
      await StreakService.updateStreak(userId, 'LOGGING', mealDate);
    } catch (err) {
      console.error('Error post-meal logging syncing:', err);
    }

    return meal;
  }

  static async getMealsByDate(userId: string, dateStr: string): Promise<any[]> {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.meal.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
        createdAt: 'asc',
      },
    });
  }

  static async getMealById(userId: string, id: string): Promise<any> {
    const meal = await prisma.meal.findFirst({
      where: {
        id,
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
    });

    if (!meal) {
      throw { statusCode: 404, message: 'Meal not found' };
    }

    return meal;
  }

  static async updateMeal(userId: string, id: string, data: any): Promise<any> {
    const { notes, items, mealType, date } = data;

    const existingMeal = await prisma.meal.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existingMeal) {
      throw { statusCode: 404, message: 'Meal not found' };
    }

    const updatedDate = date ? new Date(date) : existingMeal.date;

    return await prisma.$transaction(async (tx) => {
      // If items are provided, replace them completely
      if (items) {
        // Delete all old items first
        await tx.mealItem.deleteMany({
          where: { mealId: id },
        });

        // Re-read foods
        const foodIds = items.map((item: any) => item.foodId);
        const foods = await tx.food.findMany({
          where: { id: { in: foodIds }, deletedAt: null },
        });
        const foodMap = new Map(foods.map((f) => [f.id, f]));

        const mealItemsToCreate = items.map((item: any) => {
          const food = foodMap.get(item.foodId);
          if (!food) {
            throw { statusCode: 400, message: `Food item ${item.foodId} not found` };
          }
          const qty = item.quantity;
          return {
            mealId: id,
            foodId: food.id,
            quantity: qty,
            calories: food.calories * qty,
            protein: food.protein * qty,
            carbs: food.carbs * qty,
            fats: food.fats * qty,
          };
        });

        await tx.mealItem.createMany({
          data: mealItemsToCreate,
        });
      }

      const updatedMeal = await tx.meal.update({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : existingMeal.notes,
          mealType: mealType ? (mealType as MealType) : existingMeal.mealType,
          date: updatedDate,
        },
        include: {
          items: {
            include: {
              food: true,
            },
          },
        },
      });

      // Sync calorie logs for the new date and/or old date
      await CalorieService.syncCalorieLog(userId, existingMeal.date);
      if (date && date !== existingMeal.date.toISOString()) {
        await CalorieService.syncCalorieLog(userId, updatedDate);
      }

      return updatedMeal;
    });
  }

  static async deleteMeal(userId: string, id: string): Promise<void> {
    const meal = await prisma.meal.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!meal) {
      throw { statusCode: 404, message: 'Meal not found' };
    }

    await prisma.meal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Sync calorie log for this date
    await CalorieService.syncCalorieLog(userId, meal.date);
  }

  static async getDailyMealSummary(userId: string, dateStr: string): Promise<any> {
    const meals = await this.getMealsByDate(userId, dateStr);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    const breakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    const mealBreakdowns = meals.map((meal) => {
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fats = 0;

      meal.items.forEach((item: any) => {
        calories += item.calories;
        protein += item.protein;
        carbs += item.carbs;
        fats += item.fats;
      });

      totalCalories += calories;
      totalProtein += protein;
      totalCarbs += carbs;
      totalFats += fats;

      const type = meal.mealType.toLowerCase();
      if (type === 'breakfast') breakdown.breakfast += calories;
      else if (type === 'lunch') breakdown.lunch += calories;
      else if (type === 'dinner') breakdown.dinner += calories;
      else if (type === 'snack') breakdown.snack += calories;

      return {
        id: meal.id,
        mealType: meal.mealType,
        notes: meal.notes,
        calories,
        protein,
        carbs,
        fats,
        itemsCount: meal.items.length,
        items: meal.items,
      };
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFats: Math.round(totalFats * 10) / 10,
      breakdown,
      meals: mealBreakdowns,
    };
  }
}
