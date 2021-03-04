import React from 'react';
import './App.css';
import { Router } from '@reach/router';
import { SnackbarProvider } from "notistack";

import { SurveyEditorLoader } from "./survey/SurveyEditorLoader";

function App() {
  return (<SnackbarProvider maxSnack={3}>
      <Router>
          <SurveyEditorLoader path="/survey/:surveyId/edit" />
      </Router>
  </SnackbarProvider>);
}

export default App;
