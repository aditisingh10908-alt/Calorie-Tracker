'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { MealService } from '../../../services/meal.service';
import { FoodService } from '../../../services/food.service';
import { DailyMealSummary, Food } from '../../../types';
import { format } from 'date-fns';
import { Search, Trash2, Calendar, ChevronRight, Sun, Moon as MoonIcon, Coffee, Sunset, Plus, Edit3, Flame, Dumbbell, Wheat, Droplet, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { calculateBMI } from '../../../utils/bmi';

// Food emoji mapping by category
const FOOD_EMOJIS: Record<string, string> = {
  'Bread': '🫓',
  'Rice & Grains': '🍚',
  'Dal & Lentils': '🍲',
  'Vegetable Curry': '🥘',
  'Non-Veg': '🍗',
  'Breakfast': '🥞',
  'Snack': '🍿',
  'Dairy': '🥛',
  'Fruit': '🍎',
  'Beverage': '☕',
  'Dessert': '🍮',
  'South Indian': '🫕',
  'Chutney': '🫙',
  'Raita': '🥗',
  'Salad': '🥗',
  'Street Food': '🌮',
  'Chinese': '🥡',
  'Dry Fruits': '🥜',
  'Supplement': '💪',
};

const MEAL_ICONS: Record<string, React.ReactNode> = {
  BREAKFAST: <span className="text-lg">☀️</span>,
  LUNCH: <span className="text-lg">🌤️</span>,
  DINNER: <span className="text-lg">🌙</span>,
  SNACK: <span className="text-lg">🍪</span>,
};

const POPULAR_TAGS = ['Roti', 'Rice', 'Dal', 'Paneer', 'Banana'];

const VISIBLE_RESULTS = 5;

export default function FoodPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealSummary, setMealSummary] = useState<DailyMealSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Food[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Custom food form
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    mealType: 'BREAKFAST',
  });

  // Meal type being added to (for quick-add from search)
  const [addingToMeal, setAddingToMeal] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (mealType?: string | null) => {
    try {
      setLoadingRecommendations(true);
      const data = await FoodService.getRecommendations(mealType || undefined);
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [selectedDate]);

  useEffect(() => {
    fetchRecommendations(addingToMeal);
  }, [addingToMeal, fetchRecommendations]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const data = await MealService.getMealsByDate(selectedDate);
      setMealSummary(data);
      // Fetch recommendations initially or on refresh
      fetchRecommendations(addingToMeal);
    } catch (error) {
      console.error('Error fetching meals:', error);
      toast.error('Failed to load daily logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      setLoadingSuggestions(true);
      const results = await FoodService.searchFoods(query);
      setSuggestions(results.slice(0, 8));
      setShowSuggestions(results.length > 0);
      setActiveSuggestionIndex(-1);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous search results state when user modifies query
    if (hasSearched) {
      setHasSearched(false);
      setSearchResults([]);
    }

    // Debounced autocomplete
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      setSearching(true);
      setShowAllResults(false);
      setShowSuggestions(false);
      const results = await FoodService.searchFoods(query);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      toast.error('Failed to search foods');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    executeSearch(searchQuery);
  };

  const handleSuggestionClick = (food: Food) => {
    setSearchQuery(food.name);
    setShowSuggestions(false);
    setSuggestions([]);
    executeSearch(food.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    const currentList = searchQuery.trim() === '' ? recommendations : suggestions;
    if (currentList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < currentList.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : currentList.length - 1
      );
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      const selected = currentList[activeSuggestionIndex];
      handleSuggestionClick(selected);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setShowSuggestions(false);
    setSuggestions([]);
    executeSearch(tag);
  };

  const logFoodItem = async (food: Food, mealType: string) => {
    try {
      const payload = {
        date: new Date(selectedDate).toISOString(),
        mealType,
        items: [{ foodId: food.id, quantity: 1 }],
      };
      await MealService.logMeal(payload);
      toast.success(`Logged ${food.name} to ${mealType.toLowerCase()}`);
      setAddingToMeal(null);
      fetchMeals();
    } catch (error: any) {
      console.error('logFoodItem error:', error);
      toast.error(error?.message || 'Failed to log food');
    }
  };

  const handleCustomFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFood.name.trim() || !customFood.calories) {
      toast.error('Name and calories are required');
      return;
    }
    try {
      const createdFood = await FoodService.createCustomFood({
        name: customFood.name,
        calories: parseFloat(customFood.calories),
        protein: 0,
        carbs: 0,
        fats: 0,
        servingSize: 1,
        servingUnit: 'serving',
      });

      const payload = {
        date: new Date(selectedDate).toISOString(),
        mealType: customFood.mealType,
        items: [{ foodId: createdFood.id, quantity: 1 }],
      };
      await MealService.logMeal(payload);
      toast.success(`Created & logged ${customFood.name}`);
      setCustomFood({ name: '', calories: '', mealType: 'BREAKFAST' });
      fetchMeals();
    } catch (error: any) {
      console.error('handleCustomFoodSubmit error:', error);
      toast.error(error?.message || 'Failed to log custom food');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await MealService.deleteMeal(mealId);
      toast.success('Food removed');
      fetchMeals();
    } catch (error) {
      toast.error('Failed to remove food');
    }
  };

  const getFoodEmoji = (food: Food) => {
    if (food.category && FOOD_EMOJIS[food.category]) return FOOD_EMOJIS[food.category];
    // Fallback based on name keywords
    const name = food.name.toLowerCase();
    if (name.includes('rice') || name.includes('biryani') || name.includes('pulao')) return '🍚';
    if (name.includes('roti') || name.includes('chapati') || name.includes('naan') || name.includes('paratha')) return '🫓';
    if (name.includes('dal') || name.includes('lentil') || name.includes('sambhar')) return '🍲';
    if (name.includes('chicken') || name.includes('mutton') || name.includes('fish') || name.includes('egg')) return '🍗';
    if (name.includes('paneer')) return '🧀';
    if (name.includes('banana')) return '🍌';
    if (name.includes('apple')) return '🍎';
    if (name.includes('milk') || name.includes('curd') || name.includes('lassi')) return '🥛';
    if (name.includes('tea') || name.includes('coffee')) return '☕';
    return '🍽️';
  };

  const isVeg = (food: Food) => {
    const nonVegKeywords = ['chicken', 'mutton', 'fish', 'egg', 'prawn', 'meat', 'pork', 'lamb', 'beef', 'shrimp', 'crab'];
    const lowerName = food.name.toLowerCase();
    const lowerCategory = (food.category || '').toLowerCase();
    return !nonVegKeywords.some(kw => lowerName.includes(kw) || lowerCategory.includes(kw));
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="font-bold text-green-600 dark:text-green-400">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Macros
  const totalCal = mealSummary?.totalCalories || 0;
  const totalProtein = mealSummary?.totalProtein || 0;
  const totalCarbs = mealSummary?.totalCarbs || 0;
  const totalFats = mealSummary?.totalFats || 0;
  const targetCal = user?.tdee || 2000;
  const targetProtein = 80;
  const targetCarbs = 250;
  const targetFats = 60;

  // BMI
  const currentWeight = user?.currentWeight || 0;
  const heightVal = user?.height || 0;
  const bmi = calculateBMI(heightVal, currentWeight);

  const displayedResults = showAllResults ? searchResults : searchResults.slice(0, VISIBLE_RESULTS);

  // Format date for display
  const displayDate = format(new Date(selectedDate), 'dd/MM/yyyy');

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Food & Meals</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Track what you eat</p>
        </div>
        <div className="relative flex items-center gap-2 bg-white dark:bg-white/5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer">
          <span className="text-sm text-dark-700 dark:text-dark-200 font-medium">{displayDate}</span>
          <Calendar size={18} className="text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* === LEFT PANEL: Log Food === */}
        <div className="lg:col-span-7 space-y-5">
          {/* Search Card */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
            <div className="p-5 pb-4">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Log Food</h2>

              {/* Search Bar with Autocomplete */}
              <form onSubmit={handleSearchSubmit} className="relative mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search food..."
                      value={searchQuery}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        setShowSuggestions(true);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark-950 dark:text-white input-focus placeholder-gray-400 text-sm"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="gradient-btn px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
                    disabled={searching}
                  >
                    {searching ? '...' : 'Search'}
                  </button>
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden max-h-[380px] overflow-y-auto"
                    style={{ width: 'calc(100% - 96px)' }}
                  >
                    {searchQuery.trim() === '' ? (
                      <div>
                        <div className="px-4 py-2 text-[10px] font-bold tracking-wider text-gray-400 dark:text-dark-400 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex items-center gap-1.5 uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-green-500" />
                          Recommended foods
                        </div>
                        {loadingRecommendations ? (
                          <div className="px-4 py-4 text-xs text-dark-400 text-center">Loading recommendations...</div>
                        ) : recommendations.length === 0 ? (
                          <div className="px-4 py-4 text-xs text-dark-400 text-center">No recommendations found</div>
                        ) : (
                          recommendations.map((food, index) => (
                            <button
                              key={`rec-${food.id}`}
                              type="button"
                              onClick={() => handleSuggestionClick(food)}
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-white/5 last:border-b-0 ${
                                index === activeSuggestionIndex
                                  ? 'bg-green-50 dark:bg-green-500/10'
                                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
                              }`}
                            >
                              <span className="text-lg flex-shrink-0">{getFoodEmoji(food)}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-dark-900 dark:text-white truncate block">
                                  {food.name}
                                </span>
                                <span className="text-[10px] text-dark-450 dark:text-dark-400 block">
                                  {food.servingSize} {food.servingUnit} • {food.category || 'Other'}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                {food.calories} kcal
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div>
                        {suggestions.length === 0 && !loadingSuggestions ? (
                          <div className="px-4 py-4 text-xs text-dark-400 text-center">No suggestions found</div>
                        ) : (
                          suggestions.map((food, index) => (
                            <button
                              key={`sug-${food.id}`}
                              type="button"
                              onClick={() => handleSuggestionClick(food)}
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-white/5 last:border-b-0 ${
                                index === activeSuggestionIndex
                                  ? 'bg-green-50 dark:bg-green-500/10'
                                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
                              }`}
                            >
                              <span className="text-lg flex-shrink-0">{getFoodEmoji(food)}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-dark-900 dark:text-white truncate block">
                                  {highlightMatch(food.name, searchQuery)}
                                </span>
                                <span className="text-[10px] text-dark-450 dark:text-dark-400 block">
                                  {food.servingSize} {food.servingUnit} • {food.category || 'Other'}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                {food.calories} kcal
                              </span>
                            </button>
                          ))
                        )}
                        {loadingSuggestions && (
                          <div className="px-4 py-3 text-xs text-dark-400 text-center animate-pulse">Loading suggestions...</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Popular Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-dark-400 font-medium">Popular:</span>
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition-colors border border-green-100 dark:border-green-500/20"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results List */}
            {searchResults.length > 0 && (
              <div className="border-t border-gray-100 dark:border-white/5 rounded-b-2xl overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {displayedResults.map((food) => (
                    <div
                      key={food.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Food Emoji */}
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-xl flex-shrink-0">
                        {getFoodEmoji(food)}
                      </div>

                      {/* Food Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-dark-900 dark:text-white truncate">
                            {food.name}
                          </span>
                          <span className="font-bold text-sm text-green-600 dark:text-green-400 whitespace-nowrap ml-auto">
                            {food.calories} kcal
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-dark-500 dark:text-dark-400">
                            {food.servingSize} {food.servingUnit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Veg/Non-Veg badge */}
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isVeg(food)
                              ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-sm border ${isVeg(food) ? 'border-green-600 bg-green-600' : 'border-red-600 bg-red-600'}`} />
                            {isVeg(food) ? 'Veg' : 'Non-Veg'}
                          </span>
                          {food.category && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                              🇮🇳 {food.category === 'Non-Veg' ? 'Indian' : food.category}
                            </span>
                          )}
                          <span className="text-[10px] text-dark-400 dark:text-dark-500 ml-auto">
                            P: {food.protein}g  C: {food.carbs}g  F: {food.fats}g
                          </span>
                        </div>
                      </div>

                      {/* Quick-add buttons */}
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((type) => (
                          <button
                            key={type}
                            onClick={() => logFoodItem(food, type)}
                            className="text-[9px] font-bold px-2 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                            title={`Add to ${type.toLowerCase()}`}
                          >
                            {type === 'BREAKFAST' ? 'B' : type === 'LUNCH' ? 'L' : type === 'DINNER' ? 'D' : 'S'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More Foods link */}
                {searchResults.length > VISIBLE_RESULTS && !showAllResults && (
                  <button
                    onClick={() => setShowAllResults(true)}
                    className="w-full py-3 text-center text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-500/5 transition-colors border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-1"
                  >
                    View More Foods <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}

            {/* "No foods found" — only shown AFTER a completed search with zero results */}
            {hasSearched && !searching && searchResults.length === 0 && (
              <div className="text-center py-8 text-dark-400 dark:text-dark-500 text-sm border-t border-gray-100 dark:border-white/5">
                No foods found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Add Custom Food - Inline form */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5">
            <h3 className="text-sm font-bold text-dark-900 dark:text-white mb-3">Add Custom Food</h3>
            <form onSubmit={handleCustomFoodSubmit} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[120px]">
                <input
                  type="text"
                  placeholder="Food name"
                  value={customFood.name}
                  onChange={(e) => setCustomFood((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark-950 dark:text-white input-focus text-sm"
                  required
                />
              </div>
              <div className="w-[120px]">
                <input
                  type="number"
                  placeholder="Calories (kcal)"
                  value={customFood.calories}
                  onChange={(e) => setCustomFood((prev) => ({ ...prev, calories: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark-950 dark:text-white input-focus text-sm"
                  required
                />
              </div>
              <div className="w-[130px]">
                <select
                  value={customFood.mealType}
                  onChange={(e) => setCustomFood((prev) => ({ ...prev, mealType: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark-950 dark:text-white input-focus text-sm"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                  <option value="SNACK">Snack</option>
                </select>
              </div>
              <button
                type="submit"
                className="gradient-btn px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              >
                Add Food
              </button>
            </form>
          </div>
        </div>

        {/* === RIGHT PANEL: Meal Categories + Profile === */}
        <div className="lg:col-span-5 space-y-4">
          {/* Meal Categories */}
          {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((type) => {
            const mealsForType = mealSummary?.meals.filter((m) => m.mealType === type) || [];
            const typeCalories = Math.round(mealsForType.reduce((acc, curr) => acc + curr.calories, 0));

            return (
              <div
                key={type}
                className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {MEAL_ICONS[type]}
                    <h3 className="font-bold text-sm text-dark-900 dark:text-white capitalize">
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-dark-500 dark:text-dark-400">
                      {typeCalories} kcal
                    </span>
                    <button
                      onClick={() => setAddingToMeal(addingToMeal === type ? null : type)}
                      className="text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Food
                    </button>
                  </div>
                </div>

                {/* Meal items */}
                {mealsForType.length === 0 ? (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-dark-400 dark:text-dark-500 italic">No food logged yet.</p>
                  </div>
                ) : (
                  <div className="px-4 pb-3 space-y-1">
                    {mealsForType.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between py-1.5 group">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-dark-700 dark:text-dark-200">
                            {meal.itemsCount || 1} item{(meal.itemsCount || 1) > 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-dark-400 ml-2">
                            {Math.round(meal.calories)} kcal • P: {Math.round(meal.protein)}g
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="text-dark-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick-add search when adding */}
                {addingToMeal === type && searchResults.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-white/5 max-h-48 overflow-y-auto">
                    {searchResults.slice(0, 3).map((food) => (
                      <button
                        key={food.id}
                        onClick={() => logFoodItem(food, type)}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center justify-between transition-colors"
                      >
                        <span className="text-dark-700 dark:text-dark-200">{food.name}</span>
                        <span className="text-green-600 font-semibold">{food.calories} kcal</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Your Profile Card */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-dark-900 dark:text-white">Your Profile</h3>
              <Link
                href="/dashboard/settings"
                className="text-xs font-semibold text-dark-500 dark:text-dark-400 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-green-200 dark:hover:border-green-500/20 transition-all"
              >
                <Edit3 size={11} /> Edit Profile
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Name</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100">{user?.name || '--'}</span>
              </div>
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Current Weight</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100">{currentWeight || '--'} kg</span>
              </div>
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Gender</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100 capitalize">{user?.gender || '--'}</span>
              </div>
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Goal Weight</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100">{user?.goalWeight || '--'} kg</span>
              </div>
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Age</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100">{user?.age || '--'}</span>
              </div>
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Activity Level</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100 capitalize">{user?.activityLevel || '--'}</span>
              </div>
              <div>
                <span className="text-[11px] text-dark-400 font-medium block">Height</span>
                <span className="font-semibold text-dark-800 dark:text-dark-100">{heightVal || '--'} cm</span>
              </div>

              {/* BMI Section */}
              <div className="row-span-2 flex flex-col items-center justify-center">
                <span className="text-[11px] text-dark-400 font-medium block mb-1">Your BMI</span>
                {bmi ? (
                  <>
                    <span className="text-3xl font-black" style={{ color: bmi.color }}>
                      {bmi.value}
                    </span>
                    <span className="text-xs font-semibold mt-0.5" style={{ color: bmi.color }}>
                      {bmi.category === 'Normal' ? 'Normal Weight' : bmi.category}
                    </span>
                    <span className="text-[10px] text-dark-400 mt-1">
                      Healthy range: 18.5 - 24.9
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-dark-400">--</span>
                )}
              </div>
            </div>

            {bmi && (
              <div className="mt-4 p-3 rounded-xl bg-green-50/50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10">
                <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                  {bmi.category === 'Normal'
                    ? '✅ Great! You have a normal BMI. Keep maintaining your healthy lifestyle. 🌿'
                    : bmi.category === 'Underweight'
                    ? '💡 Your BMI suggests you may be underweight. Consider consulting a nutritionist.'
                    : bmi.category === 'Overweight'
                    ? '💡 Your BMI is slightly above normal. A balanced diet can help you reach your goal.'
                    : '⚠️ Your BMI indicates obesity. Please consult a healthcare professional.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === BOTTOM MACRO SUMMARY BAR === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
            <Flame size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Calories Consumed</p>
            <p className="text-lg font-bold text-dark-900 dark:text-white">
              {totalCal} <span className="text-xs font-normal text-dark-400">kcal</span>
            </p>
            <p className="text-[10px] text-dark-400">/ {targetCal} kcal</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Dumbbell size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Protein</p>
            <p className="text-lg font-bold text-dark-900 dark:text-white">
              {Math.round(totalProtein)} <span className="text-xs font-normal text-dark-400">g</span>
            </p>
            <p className="text-[10px] text-dark-400">/ {targetProtein} g</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Wheat size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Carbs</p>
            <p className="text-lg font-bold text-dark-900 dark:text-white">
              {Math.round(totalCarbs)} <span className="text-xs font-normal text-dark-400">g</span>
            </p>
            <p className="text-[10px] text-dark-400">/ {targetCarbs} g</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
            <Droplet size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Fats</p>
            <p className="text-lg font-bold text-dark-900 dark:text-white">
              {Math.round(totalFats)} <span className="text-xs font-normal text-dark-400">g</span>
            </p>
            <p className="text-[10px] text-dark-400">/ {targetFats} g</p>
          </div>
        </div>
      </div>
    </div>
  );
}
