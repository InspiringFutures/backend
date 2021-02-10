import React from 'react';
import './App.css';
import { Router } from '@reach/router';
import SurveyEditor from './survey/SurveyEditor';

function App() {
  return (
      <Router>
          <SurveyEditor path="/survey/:surveyId/edit" />
      </Router>
  );
}

export default App;
