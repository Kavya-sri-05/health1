import MealPlan from "../models/UserMealPlanModel.js";
import asyncHandler from "express-async-handler";

/**
 * Creates a new user meal plan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createUserMealPlan = asyncHandler(async (req, res) => {
  const { date, meal1, meal2, meal3, meal4, meal5, snacks, waterTarget } = req.body;
  const userId = req.user._id;

  const mealPlan = await MealPlan.create({
    userId,
    date,
    meal1,
    meal2,
    meal3,
    meal4,
    meal5,
    snacks,
    waterTarget
  });

  res.status(201).json({
    success: true,
    data: mealPlan
  });
});

/**
 * Retrieves a user meal plan for a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getUserMealPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { date } = req.params;

  const mealPlan = await MealPlan.findOne({ 
    userId, 
    date: new Date(date)
  }).lean();

  if (!mealPlan) {
    res.status(404);
    throw new Error('Meal plan not found');
  }

  res.json({
    success: true,
    data: mealPlan
  });
});

/**
 * Updates an existing user meal plan or creates a new one
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateUserMealPlan = asyncHandler(async (req, res) => {
  const { date, meal1, meal2, meal3, meal4, meal5, snacks, waterTarget } = req.body;
  const userId = req.user._id;

  const mealPlan = await MealPlan.findOneAndUpdate(
    { 
      userId,
      date: new Date(date)
    },
    {
      meal1,
      meal2,
      meal3,
      meal4,
      meal5,
      snacks,
      waterTarget
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  res.json({
    success: true,
    data: mealPlan
  });
});

/**
 * Retrieves all meal plans for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllUserMealPlans = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log('Getting meal plans for user:', userId);

  const mealPlans = await MealPlan.find({ userId })
    .sort({ date: -1 })
    .lean();

  console.log('Found meal plans:', mealPlans);
  res.json({
    success: true,
    data: mealPlans
  });
});

/**
 * Deletes a user meal plan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteUserMealPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { date } = req.params;

  const mealPlan = await MealPlan.findOneAndDelete({ 
    userId, 
    date: new Date(date)
  });

  if (!mealPlan) {
    res.status(404);
    throw new Error('Meal plan not found');
  }

  res.json({
    success: true,
    data: {}
  });
});
