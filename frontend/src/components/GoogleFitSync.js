import React, { useEffect, useState } from 'react';

const CLIENT_ID = '474809683933-ifrjdvapeptcclne3cdibvh6vudmoo8r.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest';
const SCOPES = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read';

const GoogleFitSync = () => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [steps, setSteps] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [status, setStatus] = useState('');

  // Load gapi script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => setGapiLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Initialize gapi client
  useEffect(() => {
    if (!gapiLoaded) return;
    window.gapi.load('client:auth2', async () => {
      try {
        await window.gapi.client.init({
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPES,
        });
        setIsSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);
      } catch (err) {
        setStatus('Google API init error: ' + getErrorMessage(err));
        console.error('Google API init error:', err);
      }
    });
  }, [gapiLoaded]);

  // Fetch data after sign-in
  useEffect(() => {
    if (!isSignedIn) return;
    fetchSteps();
    fetchHeartRate();
    // eslint-disable-next-line
  }, [isSignedIn]);

  const signIn = () => {
    window.gapi.auth2.getAuthInstance().signIn();
  };
  const signOut = () => {
    window.gapi.auth2.getAuthInstance().signOut();
    setSteps(null);
    setHeartRate(null);
    setStatus('');
  };

  function getErrorMessage(err) {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err.result && err.result.error && err.result.error.message) return err.result.error.message;
    if (err.error && err.error.message) return err.error.message;
    if (err.message) return err.message;
    return JSON.stringify(err);
  }

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
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
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
      setStatus('');
    } catch (err) {
      setStatus('Failed to fetch steps: ' + getErrorMessage(err));
      console.error('Google Fit steps error:', err);
    }
  };

  const fetchHeartRate = async () => {
    setStatus('Fetching heart rate...');
    const now = Date.now();
    const start = new Date();
    start.setHours(0,0,0,0);
    const startTime = start.getTime();
    try {
      const response = await window.gapi.client.fitness.users.dataset.aggregate({
        userId: 'me',
        resource: {
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm',
            dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: now
        }
      });
      const buckets = response.result.bucket;
      let avgHeartRate = null;
      let total = 0, count = 0;
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          if (bucket.dataset && bucket.dataset.length > 0) {
            bucket.dataset.forEach(ds => {
              if (ds.point && ds.point.length > 0) {
                ds.point.forEach(point => {
                  if (point.value && point.value.length > 0) {
                    total += point.value[0].fpVal || 0;
                    count++;
                  }
                });
              }
            });
          }
        });
      }
      if (count > 0) avgHeartRate = Math.round(total / count);
      setHeartRate(avgHeartRate);
      setStatus('');
    } catch (err) {
      setStatus('Failed to fetch heart rate: ' + getErrorMessage(err));
      console.error('Google Fit heart rate error:', err);
    }
  };

  return (
    <div style={{
      background: '#f7f9fc',
      borderRadius: 12,
      padding: 24,
      margin: '24px 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
    }}>
      <h3 style={{marginBottom: 16}}>Google Fit Sync</h3>
      {!isSignedIn ? (
        <button
          onClick={signIn}
          style={{
            background: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '10px 24px',
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          Sign in with Google
        </button>
      ) : (
        <button
          onClick={signOut}
          style={{
            background: '#aaa',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '10px 24px',
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          Sign out
        </button>
      )}
      <div style={{marginBottom: 8}}><strong>Status:</strong> {status}</div>
      {isSignedIn && (
        <>
          <div style={{marginBottom: 8}}><strong>Today's Steps:</strong> {steps !== null ? steps : 'Loading...'}</div>
          <div style={{marginBottom: 8}}><strong>Average Heart Rate:</strong> {heartRate !== null ? heartRate + ' bpm' : 'Loading...'}</div>
        </>
      )}
      <div style={{fontSize: 13, color: '#888', marginTop: 12}}>
        <em>Requires Google Fit data and user permission. Data is for today only.</em>
      </div>
    </div>
  );
};

export default GoogleFitSync; 