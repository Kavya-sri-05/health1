import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FaUtensils, FaWeight, FaPills, FaCalendarAlt, FaClock, FaCoffee, FaCarrot, FaAppleAlt, FaMoon, FaCookie } from 'react-icons/fa';
import { GiMuscleUp } from 'react-icons/gi';
import { MdEdit, MdExpandMore, MdDelete } from 'react-icons/md';
import { useGetAllMealPlansQuery, useGetAllMedicationsQuery, useDeleteMealPlanMutation, useDeleteMedicationMutation } from '../slices/usersApiSlice';
import { toast } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GoogleFitSync from '../components/GoogleFitSync';

const Dashboard = () => {
  const [dietProfile, setDietProfile] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState('mealPlans');
  
  const { 
    data: mealPlansData, 
    isLoading: isMealPlansLoading, 
    error: mealPlansError,
    refetch: refetchMealPlans
  } = useGetAllMealPlansQuery();

  const {
    data: medicationsData,
    isLoading: isMedicationsLoading,
    error: medicationsError,
    refetch: refetchMedications
  } = useGetAllMedicationsQuery();

  const [deleteMealPlan] = useDeleteMealPlanMutation();
  const [deleteMedication] = useDeleteMedicationMutation();

  const mealPlans = mealPlansData?.data || [];
  const medications = medicationsData?.data || [];
  const activeMedications = medications.filter(med => med.active);

  // Progress Tracking Calculation
  // Checkbox state: { dietProfile: bool, meals: {mealKey: bool}, medications: {medId: bool}, waterGoal: bool }
  const [progressChecks, setProgressChecks] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('progressChecks');
    if (saved) return JSON.parse(saved);
    return { dietProfile: false, meals: {}, medications: {}, waterGoal: false };
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('progressChecks', JSON.stringify(progressChecks));
  }, [progressChecks]);

  // Get latest meal plan (by date)
  const latestMealPlan = mealPlans.length > 0 ? mealPlans.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b) : null;
  const mealKeys = latestMealPlan ? ['meal1', 'meal2', 'meal3', 'meal4', 'meal5', 'snacks'].filter(k => latestMealPlan[k]) : [];
  const medicationIds = medications.map(med => med._id);
  const hasWaterTarget = latestMealPlan && latestMealPlan.waterTarget && latestMealPlan.waterTarget > 0;

  // Total items to check
  const totalItems = 1 + mealKeys.length + medicationIds.length + (hasWaterTarget ? 1 : 0); // 1 for dietProfile, 1 for water if set
  const checkedItems = (
    (progressChecks.dietProfile ? 1 : 0) +
    mealKeys.filter(k => progressChecks.meals && progressChecks.meals[k]).length +
    medicationIds.filter(id => progressChecks.medications && progressChecks.medications[id]).length +
    (hasWaterTarget && progressChecks.waterGoal ? 1 : 0)
  );
  const progressLevel = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  // Handlers
  const handleDietProfileCheck = (e) => {
    setProgressChecks(prev => ({ ...prev, dietProfile: e.target.checked }));
  };
  const handleMealCheck = (mealKey) => (e) => {
    setProgressChecks(prev => ({
      ...prev,
      meals: { ...prev.meals, [mealKey]: e.target.checked },
    }));
  };
  const handleMedicationCheck = (medId) => (e) => {
    setProgressChecks(prev => ({
      ...prev,
      medications: { ...prev.medications, [medId]: e.target.checked },
    }));
  };
  const handleWaterGoalCheck = (e) => {
    setProgressChecks(prev => ({ ...prev, waterGoal: e.target.checked }));
  };

  // Badge logic for every progress level
  let badgeIcon = null;
  let badgeColor = '';
  let badgeLabel = '';

  if (progressLevel === 0) {
    badgeIcon = <HourglassEmptyIcon style={{ color: '#757575' }} />;
    badgeColor = '#bdbdbd';
    badgeLabel = 'Let\'s Start!';
  } else if (progressLevel > 0 && progressLevel < 25) {
    badgeIcon = <HourglassEmptyIcon style={{ color: '#f44336' }} />;
    badgeColor = '#f44336';
    badgeLabel = `Warming Up (${progressLevel}%)`;
  } else if (progressLevel >= 25 && progressLevel < 50) {
    badgeIcon = <TrendingUpIcon style={{ color: '#ff9800' }} />;
    badgeColor = '#ff9800';
    badgeLabel = `Keep Going! (${progressLevel}%)`;
  } else if (progressLevel >= 50 && progressLevel < 75) {
    badgeIcon = <StarIcon style={{ color: '#1976d2' }} />;
    badgeColor = '#1976d2';
    badgeLabel = `Halfway There! (${progressLevel}%)`;
  } else if (progressLevel >= 75 && progressLevel < 100) {
    badgeIcon = <RocketLaunchIcon style={{ color: '#8e24aa' }} />;
    badgeColor = '#8e24aa';
    badgeLabel = `Almost There! (${progressLevel}%)`;
  } else if (progressLevel === 100) {
    badgeIcon = <EmojiEventsIcon style={{ color: '#fff' }} />;
    badgeColor = '#4caf50';
    badgeLabel = 'Champion! 100% Complete';
  }

  // Add a refresh handler for the diet profile
  const refreshDietProfile = () => {
    const profileData = localStorage.getItem('profileData');
    if (profileData) {
      try {
        const parsedData = JSON.parse(profileData);
        setDietProfile(parsedData);
      } catch (error) {
        console.error("Error refreshing profile data:", error);
      }
    }
  };

  // Add event listener for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'profileData') {
        refreshDietProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const getMealIcon = (mealType) => {
    switch(mealType) {
      case 'meal1': return <FaCoffee />;
      case 'meal2': return <FaCarrot />;
      case 'meal3': return <FaUtensils />;
      case 'meal4': return <FaAppleAlt />;
      case 'meal5': return <FaMoon />;
      case 'snacks': return <FaCookie />;
      default: return <FaUtensils />;
    }
  };

  const getMealLabel = (mealType) => {
    switch(mealType) {
      case 'meal1': return 'Breakfast';
      case 'meal2': return 'Morning Snack';
      case 'meal3': return 'Lunch';
      case 'meal4': return 'Afternoon Snack';
      case 'meal5': return 'Dinner';
      case 'snacks': return 'Additional Snacks';
      default: return mealType;
    }
  };

  const getMealCount = (plan) => {
    return Object.entries(plan)
      .filter(([key, value]) => 
        ['meal1', 'meal2', 'meal3', 'meal4', 'meal5', 'snacks'].includes(key) && 
        value && 
        value.trim().length > 0
      ).length;
  };

  const handleDeleteMealPlan = async (date) => {
    try {
      const formattedDate = new Date(date).toISOString().split('T')[0];
      await deleteMealPlan(formattedDate);
      await refetchMealPlans();
      toast.success('Meal plan deleted successfully');
    } catch (err) {
      console.error('Delete meal plan error:', err);
      toast.error(err?.data?.message || 'Failed to delete meal plan');
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      await deleteMedication(id);
      await refetchMedications();
      toast.success('Medication deleted successfully');
    } catch (err) {
      console.error('Delete medication error:', err);
      toast.error(err?.data?.message || 'Failed to delete medication');
    }
  };

  if (isMealPlansLoading || isMedicationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GoogleFitSync />
      <Typography variant="h4" component="h1" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <GiMuscleUp size={40} color="#4A90E2" />
        Your Health Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* Diet Profile Summary */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ height: '100%' }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaWeight /> Diet Profile
                </Typography>
                <Button
                  component={Link}
                  to="/pages/diet-profile"
                  startIcon={<MdEdit />}
                  variant="outlined"
                  size="small"
                >
                  Edit Profile
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {dietProfile ? (
                <List dense>
                  <ListItem>
                    <ListItemText primary="Current Weight" secondary={`${dietProfile.weight} kg`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Goal Weight" secondary={`${dietProfile.goalWeight} kg`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Activity Level" secondary={dietProfile.activityLevel} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Goal" secondary={dietProfile.goal} />
                  </ListItem>
                  {hasWaterTarget && (
                    <ListItem>
                      <ListItemText primary="Water Goal" secondary={`${latestMealPlan.waterTarget && latestMealPlan.waterTarget > 0 ? latestMealPlan.waterTarget : 0} L`} />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography color="text.secondary">No diet profile set up yet.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Stats</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{mealPlans.length}</Typography>
                    <Typography variant="subtitle2">Saved Meal Plans</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{activeMedications.length}</Typography>
                    <Typography variant="subtitle2">Active Medications</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Progress Tracking */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ height: '100%', p: 3, mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Progress Tracking</Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <FormControlLabel
                control={<Checkbox checked={progressChecks.dietProfile} onChange={handleDietProfileCheck} color="success" />}
                label={<span style={{ fontWeight: 500 }}>Diet Profile Completed</span>}
              />
              {mealKeys.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Meals:</Typography>
                  {mealKeys.map(mealKey => (
                    <FormControlLabel
                      key={mealKey}
                      control={<Checkbox checked={progressChecks.meals && progressChecks.meals[mealKey]} onChange={handleMealCheck(mealKey)} color="primary" />}
                      label={<span style={{ fontWeight: 400 }}>{getMealLabel(mealKey)} ({latestMealPlan[mealKey]})</span>}
                    />
                  ))}
                </Box>
              )}
              {medicationIds.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Medications:</Typography>
                  {medications.map(med => (
                    <FormControlLabel
                      key={med._id}
                      control={<Checkbox checked={progressChecks.medications && progressChecks.medications[med._id]} onChange={handleMedicationCheck(med._id)} color="secondary" />}
                      label={<span style={{ fontWeight: 400 }}>{med.name} ({med.dosage})</span>}
                    />
                  ))}
                </Box>
              )}
              {hasWaterTarget && (
                <FormControlLabel
                  control={<Checkbox checked={progressChecks.waterGoal || false} onChange={handleWaterGoalCheck} color="info" />}
                  label={<span style={{ fontWeight: 500 }}>Water Goal Met ({latestMealPlan.waterTarget} L)</span>}
                />
              )}
            </Box>
            <Box sx={{ width: '100%', mb: 1 }}>
              <Box sx={{ height: 24, background: '#e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                <Box sx={{ width: `${progressLevel}%`, height: '100%', background: progressLevel === 100 ? '#4caf50' : progressLevel >= 75 ? '#8e24aa' : progressLevel >= 50 ? '#1976d2' : progressLevel >= 25 ? '#ff9800' : progressLevel > 0 ? '#f44336' : '#bdbdbd', transition: 'width 0.5s' }} />
              </Box>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Chip
                icon={badgeIcon}
                label={badgeLabel}
                sx={{ bgcolor: badgeColor, color: progressLevel === 100 ? '#fff' : '#fff', fontWeight: 'bold', fontSize: '1rem', px: 2, py: 1, boxShadow: 2 }}
              />
            </Box>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {progressLevel === 0 && 'Start by completing your diet profile, following your meal plan, and taking your medications!'}
              {progressLevel > 0 && progressLevel < 50 && 'Good start! Keep going to reach the next milestone.'}
              {progressLevel >= 50 && progressLevel < 100 && 'Awesome! You are halfway there.'}
              {progressLevel === 100 && 'Congratulations! You are a champion at following your health plan!'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Sections */}
      <Box sx={{ mt: 4 }}>
        {/* Saved Meal Plans Section */}
        <Accordion 
          expanded={expandedAccordion === 'mealPlans'} 
          onChange={handleAccordionChange('mealPlans')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<MdExpandMore />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaUtensils /> Saved Meal Plans
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {mealPlans.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Meals</TableCell>
                      <TableCell>Total Meals</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mealPlans.map((plan) => (
                      <TableRow key={plan.date}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaCalendarAlt />
                            {new Date(plan.date).toLocaleDateString()}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {Object.entries(plan).map(([key, value]) => {
                              if (['meal1', 'meal2', 'meal3', 'meal4', 'meal5', 'snacks'].includes(key) && value && value.trim().length > 0) {
                                let label = '';
                                let icon = null;
                                
                                switch(key) {
                                  case 'meal1':
                                    label = `Breakfast: ${value}`;
                                    icon = <FaCoffee />;
                                    break;
                                  case 'meal2':
                                    label = `Morning Snack: ${value}`;
                                    icon = <FaCarrot />;
                                    break;
                                  case 'meal3':
                                    label = `Lunch: ${value}`;
                                    icon = <FaUtensils />;
                                    break;
                                  case 'meal4':
                                    label = `Afternoon Snack: ${value}`;
                                    icon = <FaAppleAlt />;
                                    break;
                                  case 'meal5':
                                    label = `Dinner: ${value}`;
                                    icon = <FaMoon />;
                                    break;
                                  case 'snacks':
                                    label = `Snacks: ${value}`;
                                    icon = <FaCookie />;
                                    break;
                                  default:
                                    return null;
                                }
                                
                                return (
                                  <Chip
                                    key={key}
                                    icon={icon}
                                    label={label}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ maxWidth: 300 }}
                                  />
                                );
                              }
                              return null;
                            })}
                          </Box>
                        </TableCell>
                        <TableCell>{getMealCount(plan)} meals</TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            to="/pages/meal-plan"
                            startIcon={<MdEdit />}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <IconButton
                            onClick={() => handleDeleteMealPlan(plan.date)}
                            color="error"
                            size="small"
                            title="Delete meal plan"
                          >
                            <MdDelete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" align="center">
                No meal plans saved yet. <Link to="/pages/meal-plan">Create your first meal plan</Link>
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Medications Section */}
        <Accordion 
          expanded={expandedAccordion === 'medications'} 
          onChange={handleAccordionChange('medications')}
        >
          <AccordionSummary expandIcon={<MdExpandMore />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaPills /> Medications
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {medications.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Dosage</TableCell>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medications.map((medication) => (
                      <TableRow key={medication._id}>
                        <TableCell>{medication.name}</TableCell>
                        <TableCell>{medication.dosage}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaClock />
                            {medication.frequency}, {medication.time}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={medication.active ? "Active" : "Inactive"}
                            color={medication.active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            to="/pages/medications"
                            startIcon={<MdEdit />}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <IconButton
                            onClick={() => handleDeleteMedication(medication._id)}
                            color="error"
                            size="small"
                            title="Delete medication"
                          >
                            <MdDelete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" align="center">
                No medications added yet. <Link to="/pages/medications">Add your first medication</Link>
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
};

export default Dashboard; 