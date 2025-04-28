import mongoose from "mongoose";

const userMealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value <= new Date(new Date().setHours(23, 59, 59, 999));
      },
      message: "Date cannot be in the future"
    }
  },
  meal1: {
    type: String,
    maxlength: [500, "Meal description cannot exceed 500 characters"],
    trim: true
  },
  meal2: {
    type: String,
    maxlength: [500, "Meal description cannot exceed 500 characters"],
    trim: true
  },
  meal3: {
    type: String,
    maxlength: [500, "Meal description cannot exceed 500 characters"],
    trim: true
  },
  meal4: {
    type: String,
    maxlength: [500, "Meal description cannot exceed 500 characters"],
    trim: true
  },
  meal5: {
    type: String,
    maxlength: [500, "Meal description cannot exceed 500 characters"],
    trim: true
  },
  snacks: {
    type: String,
    maxlength: [500, "Snacks description cannot exceed 500 characters"],
    trim: true
  },
  waterTarget: {
    type: Number,
    min: [0, "Water target must be positive"],
    max: [20, "Water target seems too high"],
    default: 0,
  },
});

// Add index for efficient queries
userMealPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

const MealPlan = mongoose.model("MealPlan", userMealPlanSchema);

export default MealPlan;