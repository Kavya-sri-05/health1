import React, { useEffect, useRef, useState } from 'react';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Paper, Box, Typography, Button } from '@mui/material';

const CLIENT_ID = '474809683933-ifrjdvapeptcclne3cdibvh6vudmoo8r.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest';
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read'
].join(' ');

const GoogleFitSync = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [steps, setSteps] = useState(null);
  const [heartPoints, setHeartPoints] = useState(null);
  const [targetSteps, setTargetSteps] = useState(null);
  const [targetHeartPoints, setTargetHeartPoints] = useState(null);
  const [status, setStatus] = useState('');
  const tokenClient = useRef(null);

  // Load GIS and gapi scripts
  useEffect(() => {
    // Load Google Identity Services
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    document.body.appendChild(gisScript);

    // Load gapi
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
      });
    };
    document.body.appendChild(gapiScript);

    return () => {
      document.body.removeChild(gisScript);
      document.body.removeChild(gapiScript);
    };
  }, []);

  // Initialize GIS token client
  useEffect(() => {
    if (!window.google || !window.google.accounts) return;
    tokenClient.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setIsSignedIn(true);
          setStatus('Signed in! Fetching data...');
          fetchSteps();
          fetchHeartPoints();
          fetchGoals();
        } else {
          setStatus('Failed to get access token.');
        }
      },
    });
  }, [window.google && window.google.accounts]);

  const signIn = () => {
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken({ prompt: 'consent' });
    } else {
      setStatus('Google Identity Services not loaded yet.');
    }
  };

  const signOut = () => {
    setIsSignedIn(false);
    setSteps(null);
    setHeartPoints(null);
    setTargetSteps(null);
    setTargetHeartPoints(null);
    setStatus('');
  };

  const showLoadedStatus = () => {
    setStatus('Data loaded!');
    setTimeout(() => setStatus(''), 2000);
  };

  const fetchSteps = async () => {
    setStatus('Fetching steps...');
    const now = Date.now();
    const start = new Date();
    start.setHours(0,0,0,0);
    const startTime = start.getTime();
    try {
      const response = await window.gapi.client.fitness.users.dataset.aggregate({
        userId: 'me',
        resource: {
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: now
        }
      });
      const buckets = response.result.bucket;
      let totalSteps = 0;
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          if (bucket.dataset && bucket.dataset.length > 0) {
            bucket.dataset.forEach(ds => {
              if (ds.point && ds.point.length > 0) {
                ds.point.forEach(point => {
                  if (point.value && point.value.length > 0) {
                    totalSteps += point.value[0].intVal || 0;
                  }
                });
              }
            });
          }
        });
      }
      setSteps(totalSteps);
      showLoadedStatus();
    } catch (err) {
      setStatus('Failed to fetch steps: ' + (err.message || JSON.stringify(err)));
      console.error('Google Fit steps error:', err);
    }
  };

  const fetchHeartPoints = async () => {
    setStatus('Fetching heart points...');
    const now = Date.now();
    const start = new Date();
    start.setHours(0,0,0,0);
    const startTime = start.getTime();
    try {
      const response = await window.gapi.client.fitness.users.dataset.aggregate({
        userId: 'me',
        resource: {
          aggregateBy: [{
            dataTypeName: 'com.google.heart_minutes'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: now
        }
      });
      const buckets = response.result.bucket;
      let totalHeartPoints = 0;
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          if (bucket.dataset && bucket.dataset.length > 0) {
            bucket.dataset.forEach(ds => {
              if (ds.point && ds.point.length > 0) {
                ds.point.forEach(point => {
                  if (point.value && point.value.length > 0) {
                    totalHeartPoints += point.value[0].fpVal || 0;
                  }
                });
              }
            });
          }
        });
      }
      setHeartPoints(Math.round(totalHeartPoints));
      showLoadedStatus();
    } catch (err) {
      setStatus('Failed to fetch heart points: ' + (err.message || JSON.stringify(err)));
      console.error('Google Fit heart points error:', err);
    }
  };

  // Fetch Google Fit goals (if set)
  const fetchGoals = async () => {
    try {
      const response = await window.gapi.client.fitness.users.goals.list({
        userId: 'me'
      });
      if (response.result && response.result.items) {
        let foundStepGoal = false;
        let foundHeartGoal = false;
        response.result.items.forEach(goal => {
          if (goal.metric === 'com.google.step_count.delta' && goal.value && goal.value.intVal) {
            setTargetSteps(goal.value.intVal);
            foundStepGoal = true;
          }
          if (goal.metric === 'com.google.heart_minutes' && goal.value && goal.value.intVal) {
            setTargetHeartPoints(goal.value.intVal);
            foundHeartGoal = true;
          }
        });
        if (!foundStepGoal) setTargetSteps(null);
        if (!foundHeartGoal) setTargetHeartPoints(null);
      } else {
        setTargetSteps(null);
        setTargetHeartPoints(null);
      }
    } catch (err) {
      setTargetSteps(null);
      setTargetHeartPoints(null);
      console.warn('Could not fetch Google Fit goals:', err);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4, background: '#f7f9fc' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" color="primary" fontWeight={700}>
          Google Fit Sync
        </Typography>
      </Box>
      {!isSignedIn ? (
        <Button
          onClick={signIn}
          variant="contained"
          color="primary"
          sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}
        >
          Sign in with Google
        </Button>
      ) : (
        <Button
          onClick={signOut}
          variant="outlined"
          color="secondary"
          sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}
        >
          Sign out
        </Button>
      )}
      <Typography sx={{ mb: 2, color: '#888' }}><strong>Status:</strong> {status}</Typography>
      {isSignedIn && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DirectionsWalkIcon color="primary" />
            <Typography>
              <strong>Today's Steps:</strong> {steps !== null ? steps : 'Loading...'}
              {targetSteps !== null
                ? <span style={{ color: steps >= targetSteps ? '#4caf50' : '#f44336', fontWeight: 600 }}> / Target: {targetSteps}</span>
                : <span style={{ color: '#888', fontStyle: 'italic' }}> (No target set in Google Fit)</span>
              }
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FavoriteIcon color="error" />
            <Typography>
              <strong>Today's Heart Points:</strong> {heartPoints !== null ? heartPoints : 'Loading...'}
              {targetHeartPoints !== null
                ? <span style={{ color: heartPoints >= targetHeartPoints ? '#4caf50' : '#f44336', fontWeight: 600 }}> / Target: {targetHeartPoints}</span>
                : <span style={{ color: '#888', fontStyle: 'italic' }}> (No target set in Google Fit)</span>
              }
            </Typography>
          </Box>
        </Box>
      )}
      <Typography variant="caption" sx={{ color: '#888', mt: 2, display: 'block' }}>
        <em>Requires Google Fit data and user permission. Data is for today only.</em>
      </Typography>
    </Paper>
  );
};

export default GoogleFitSync; 