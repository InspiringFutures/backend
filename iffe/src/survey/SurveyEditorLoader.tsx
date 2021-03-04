import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "@reach/router";
import { SurveyEditor } from "./SurveyEditor";
import { LinearProgress } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { loadSurvey, saveSurvey, SurveyInfo } from "./api";

interface SurveyEditorLoaderProps extends RouteComponentProps {
    surveyId?: string
}

export function SurveyEditorLoader({surveyId}: SurveyEditorLoaderProps) {
    const classes = useStyles();
    const [content, setContent] = useState<SurveyInfo>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        loadSurvey(surveyId, setContent, setError);
    }, [surveyId]);


    return content ?
        <SurveyEditor saveContent={(content) => saveSurvey(surveyId, content)} surveyInfo={content} />
    :
        <div className={classes.root}>
            {error && <div className={classes.error}>Error loading survey: {error}</div>}
            {!error && <>
                <LinearProgress className={classes.progress} />
                <div>Loading survey editor...</div>
            </>}
        </div>
    ;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
        },
        progress: {
            width: '50%',
            marginBottom: '2em',
        },
        error: {
            color: theme.palette.error.dark,
        },
    }),
);
