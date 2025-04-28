import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from 'react-redux';
import {
  useCreateMealPlanMutation,
  useUpdateMealPlanMutation,
  useGetAllMealPlansQuery,
} from "../slices/usersApiSlice";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import { 
  FaUtensils, 
  FaCoffee, 
  FaCarrot, 
  FaAppleAlt,
  FaMoon,
  FaCookie,
  FaCalendarAlt,
  FaTrash,
  FaEdit
} from 'react-icons/fa';

const MealInput = ({ icon: Icon, label, value, onChange, placeholder }) => (
  <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Icon size={20} style={{ color: '#4A90E2', marginRight: '10px' }} />
        <Typography variant="h6" component="h3" sx={{ color: '#2C3E50' }}>
          {label}
        </Typography>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#4A90E2',
            },
          },
        }}
      />
    </CardContent>
  </Card>
);

const MealPlan = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [meal1, setMeal1] = useState("");
  const [meal2, setMeal2] = useState("");
  const [meal3, setMeal3] = useState("");
  const [meal4, setMeal4] = useState("");
  const [meal5, setMeal5] = useState("");
  const [snacks, setSnacks] = useState("");
  const [waterTarget, setWaterTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedMealPlans, setSavedMealPlans] = useState([]);

  const [createMealPlan, { isLoading: isCreating }] = useCreateMealPlanMutation();
  const [updateMealPlan, { isLoading: isUpdating }] = useUpdateMealPlanMutation();
  const { data: mealPlansData, error: mealPlansError, isLoading: isFetchingMealPlans } = useGetAllMealPlansQuery();

  useEffect(() => {
    if (mealPlansData) {
      setSavedMealPlans(mealPlansData.data || []);
    }
  }, [mealPlansData]);

  useEffect(() => {
    if (mealPlansError) {
      toast.error(mealPlansError?.data?.message || "Failed to load saved meal plans");
    }
  }, [mealPlansError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInfo) {
      toast.error("Please log in to save meal plans");
      return;
    }
    if (!waterTarget || Number(waterTarget) <= 0) {
      toast.error("Please enter your water intake goal for the day (in litres)");
      return;
    }

    try {
      const mealPlanData = {
        date: currentDate,
        meal1,
        meal2,
        meal3,
        meal4,
        meal5,
        snacks,
        waterTarget: waterTarget ? Number(waterTarget) : 0,
      };

      console.log('Submitting meal plan:', mealPlanData);

      try {
        const updateResult = await updateMealPlan(mealPlanData).unwrap();
        console.log('Update result:', updateResult);
        toast.success("Meal plan updated successfully!");
      } catch (updateError) {
        console.log('Update error:', updateError);
        if (updateError.status === 404) {
          const createResult = await createMealPlan(mealPlanData).unwrap();
          console.log('Create result:', createResult);
          toast.success("Meal plan created successfully!");
        } else {
          throw updateError;
        }
      }
    } catch (error) {
      console.error("Save meal plan error:", error);
      toast.error(error?.data?.message || "Failed to save meal plan");
    }
  };

  const handleDeleteMealPlan = async (date) => {
    try {
      const response = await fetch(`/api/user/meal-plan/${date}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete meal plan');
      }
      setSavedMealPlans(savedMealPlans.filter(plan => plan.date !== date));
      toast.success("Meal plan deleted successfully!");
    } catch (error) {
      console.error("Delete meal plan error:", error);
      toast.error("Failed to delete meal plan");
    }
  };

  const handleEditMealPlan = (plan) => {
    setCurrentDate(plan.date);
    setMeal1(plan.meal1 || "");
    setMeal2(plan.meal2 || "");
    setMeal3(plan.meal3 || "");
    setMeal4(plan.meal4 || "");
    setMeal5(plan.meal5 || "");
    setSnacks(plan.snacks || "");
    setWaterTarget(plan.waterTarget !== undefined && plan.waterTarget !== null ? plan.waterTarget : "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMealCount = (plan) => {
    return [plan.meal1, plan.meal2, plan.meal3, plan.meal4, plan.meal5, plan.snacks]
      .filter(meal => meal && meal.trim().length > 0).length;
  };

  if (isLoading || isCreating || isUpdating) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #EBF4F5 0%, #F7F9FC 100%)'
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            color: '#2C3E50',
            fontWeight: 'bold',
            mb: 4
          }}
        >
          Daily Meal Planner
        </Typography>

        <Form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#2C3E50' }}>
              Select Date
            </Typography>
            <TextField
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              fullWidth
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 1
              }}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#2C3E50' }}>
              Water Intake Goal (litres)
            </Typography>
            <TextField
              type="number"
              value={waterTarget}
              onChange={(e) => setWaterTarget(e.target.value)}
              fullWidth
              inputProps={{ min: 0, max: 20, step: 0.1 }}
              placeholder="e.g. 2.5"
              sx={{ backgroundColor: 'white', borderRadius: 1 }}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <MealInput
                icon={FaCoffee}
                label="Breakfast"
                value={meal1}
                onChange={(e) => setMeal1(e.target.value)}
                placeholder="Enter your breakfast plan"
              />
              <MealInput
                icon={FaCarrot}
                label="Morning Snack"
                value={meal2}
                onChange={(e) => setMeal2(e.target.value)}
                placeholder="Enter your morning snack"
              />
              <MealInput
                icon={FaUtensils}
                label="Lunch"
                value={meal3}
                onChange={(e) => setMeal3(e.target.value)}
                placeholder="Enter your lunch plan"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MealInput
                icon={FaAppleAlt}
                label="Afternoon Snack"
                value={meal4}
                onChange={(e) => setMeal4(e.target.value)}
                placeholder="Enter your afternoon snack"
              />
              <MealInput
                icon={FaMoon}
                label="Dinner"
                value={meal5}
                onChange={(e) => setMeal5(e.target.value)}
                placeholder="Enter your dinner plan"
              />
              <MealInput
                icon={FaCookie}
                label="Additional Snacks"
                value={snacks}
                onChange={(e) => setSnacks(e.target.value)}
                placeholder="Enter any additional snacks"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              type="submit"
              disabled={isLoading || isCreating || isUpdating}
              sx={{
                backgroundColor: '#4A90E2',
                color: 'white',
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: '#357ABD'
                }
              }}
            >
              {isCreating || isUpdating ? 'Saving...' : 'Save Meal Plan'}
            </Button>
          </Box>
        </Form>
      </Paper>

      {/* Saved Meal Plans Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 4, 
          p: 4, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #EBF4F5 0%, #F7F9FC 100%)'
        }}
      >
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          sx={{ 
            color: '#2C3E50',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3
          }}
        >
          <FaUtensils />
          Saved Meal Plans
        </Typography>

        {savedMealPlans.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Meals Overview</TableCell>
                  <TableCell>Total Meals</TableCell>
                  <TableCell>Water Goal (L)</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedMealPlans.map((plan) => (
                  <TableRow key={plan.date} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaCalendarAlt />
                        {new Date(plan.date).toLocaleDateString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {plan.meal1 && (
                          <Chip
                            icon={<FaCoffee />}
                            label={`Breakfast: ${plan.meal1}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: 300 }}
                          />
                        )}
                        {plan.meal2 && (
                          <Chip
                            icon={<FaCarrot />}
                            label={`Morning Snack: ${plan.meal2}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: 300 }}
                          />
                        )}
                        {plan.meal3 && (
                          <Chip
                            icon={<FaUtensils />}
                            label={`Lunch: ${plan.meal3}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: 300 }}
                          />
                        )}
                        {plan.meal4 && (
                          <Chip
                            icon={<FaAppleAlt />}
                            label={`Afternoon Snack: ${plan.meal4}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: 300 }}
                          />
                        )}
                        {plan.meal5 && (
                          <Chip
                            icon={<FaMoon />}
                            label={`Dinner: ${plan.meal5}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: 300 }}
                          />
                        )}
                        {plan.snacks && (
                          <Chip
                            icon={<FaCookie />}
                            label={`Snacks: ${plan.snacks}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: 300 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{getMealCount(plan)} meals</TableCell>
                    <TableCell>{plan.waterTarget && plan.waterTarget > 0 ? plan.waterTarget : 0} L</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleEditMealPlan(plan)}
                        sx={{ mr: 1 }}
                      >
                        <FaEdit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteMealPlan(plan.date)}
                      >
                        <FaTrash />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary" align="center">
            No meal plans saved yet. Create your first meal plan above!
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default MealPlan;
