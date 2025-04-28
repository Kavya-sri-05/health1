import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUpdateStatusMutation } from "../slices/usersApiSlice";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container
} from "@mui/material";
import { FiActivity } from 'react-icons/fi';
import CircularProgress from '@mui/material/CircularProgress';

const UpdateDietProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState("");

  const [updateStatus] = useUpdateStatusMutation();

  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [fat, setFat] = useState(0);
  const [carbs, setCarbs] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("/api/user/status");
        const data = await response.json();

        if (data) {
          setHeight(data.height || "");
          setWeight(data.weight || "");
          setGoalWeight(data.goalWeight || "");
          setAge(data.age || "");
          setGender(data.gender || "");
          setActivityLevel(data.activityLevel || "");
          setGoal(data.goal || "");

          const profileData = JSON.stringify(data);
          localStorage.setItem("profileData", profileData);
        }

        setIsLoading(false);
      } catch (err) {
        toast.error("Failed to fetch profile data.");
        toast.error(err?.data?.message || err.error);
        setIsLoading(false);
      }
    };

    const profileData = localStorage.getItem("profileData");
    if (profileData) {
      try {
        const parsedData = JSON.parse(profileData);
        setHeight(parsedData.height || "");
        setWeight(parsedData.weight || "");
        setGoalWeight(parsedData.goalWeight || "");
        setAge(parsedData.age || "");
        setGender(parsedData.gender || "");
        setActivityLevel(parsedData.activityLevel || "");
        setGoal(parsedData.goal || "");
      } catch (error) {
        console.error("Error parsing profile data:", error);
        localStorage.removeItem("profileData");
        fetchProfileData();
      }
    } else {
      fetchProfileData();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (weight && activityLevel && goal) {
      const activityMultiplier = {
        sedentary: 1.4,
        lightlyActive: 1.6,
        active: 1.8,
        veryActive: 2.0,
      }[activityLevel];

      let calculatedCalories = weight * 22 * activityMultiplier;
      let calculatedProtein = weight * 2.2;

      switch (goal) {
        case "Cutting":
          calculatedCalories -= 500;
          break;
        case "Bulking":
          calculatedCalories += 500;
          break;
        default:
          break;
      }

      let calculatedFat = (calculatedCalories * 0.25) / 9; // Convert to grams
      let calculatedCarbs =
        (calculatedCalories - (calculatedProtein * 4 + calculatedFat * 9)) / 4; // Convert to grams

      setCalories(calculatedCalories);
      setProtein(calculatedProtein);
      setFat(calculatedFat);
      setCarbs(calculatedCarbs);
    }
  }, [weight, activityLevel, goal]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (
      height &&
      weight &&
      goalWeight &&
      age &&
      gender &&
      activityLevel &&
      goal
    ) {
      try {
        const updatedProfile = {
          height,
          weight,
          goalWeight,
          age,
          gender,
          activityLevel,
          goal,
        };

        const response = await updateStatus(updatedProfile).unwrap();
        
        // Update localStorage with the complete response data
        localStorage.setItem("profileData", JSON.stringify(response));
        
        toast.success("Diet Profile Updated Successfully!");
        
        // Force a page reload to ensure dashboard gets the latest data
        window.location.reload();
      } catch (err) {
        console.error("Update error:", err);
        toast.error(err?.data?.message || "Failed to update diet profile. Please try again.");
      }
    } else {
      toast.error("Please fill in all the required fields.");
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FiActivity size={32} color="#4A90E2" />
          <Typography variant="h4" component="h1" color="primary">
            Update Diet Profile
          </Typography>
        </Box>

        <Box component="form" onSubmit={submitHandler}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Height (CM)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                variant="outlined"
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight (KG)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                variant="outlined"
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Goal Weight (KG)"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                variant="outlined"
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                variant="outlined"
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  label="Gender"
                  required
                >
                  <MenuItem value="">Select gender</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Activity Level</InputLabel>
                <Select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  label="Activity Level"
                  required
                >
                  <MenuItem value="">Select activity level</MenuItem>
                  <MenuItem value="sedentary">Sedentary</MenuItem>
                  <MenuItem value="lightlyActive">Lightly Active</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="veryActive">Very Active</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Goal</InputLabel>
                <Select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  label="Goal"
                  required
                >
                  <MenuItem value="">Select goal</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Cutting">Cutting</MenuItem>
                  <MenuItem value="Bulking">Bulking</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 4, width: '100%' }}
          >
            Update Diet Profile
          </Button>
        </Box>
      </Paper>

      {(calories > 0) && (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Daily Nutritional Requirements
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Calories</TableCell>
                  <TableCell>Protein</TableCell>
                  <TableCell>Fat</TableCell>
                  <TableCell>Carbs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      {Math.round(calories)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      kcal/day
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      {Math.round(protein)}g
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Protein
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      {Math.round(fat)}g
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Fat
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      {Math.round(carbs)}g
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Carbs
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default UpdateDietProfile;
