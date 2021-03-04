import React, { useEffect, useState } from "react";
import {
    Button, Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, FormControlLabel, List, ListItem, ListItemIcon, ListItemText, MenuItem, Select,
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import { Content } from "./SurveyContent";

import { InjectedDialogProps } from "./MakeDialog";
import { loadSurvey, loadSurveys, SurveyInfo, SurveySummary } from "./api";
import { ContentTypeInfo } from "./Sidebar";

interface ImportProps {
    addContent: (addedContent: Content[]) => void;
    surveyId: number;
}

let requestCount = 0;
function check<T>(request: number, setValue: (value: T) => void) {
    return function (value: T) {
        if (request === requestCount) {
            setValue(value);
        }
    };
}

export function ImportDialog({
                                 isOpen,
                                 close,
                                 addContent,
                                 surveyId,
                              }: (InjectedDialogProps & ImportProps)) {
    const classes = useStyles();

    const [error, setError] = useState<string>();

    const [surveys, setSurveys] = useState<SurveySummary[]>();

    useEffect(() => {
        loadSurveys(surveyId, setSurveys, setError);
    }, [surveyId]);

    const [selectedSurveyId, setSelectedSurveyId] = useState<number>();
    const [survey, setSurvey] = useState<SurveyInfo>();
    const [selectedContentIds, setSelectedContentIds] = useState<{[id: string]: boolean}>({});

    useEffect(() => {
        const request = ++requestCount;
        if (selectedSurveyId !== undefined) {
            loadSurvey(selectedSurveyId, check(request, (survey) => {setSurvey(survey); setSelectedContentIds({})}), check(request, setError));
            return () => {
                setSurvey((currentSurvey) => {
                    if (currentSurvey?.id === selectedSurveyId) {
                        return undefined;
                    } else {
                        return currentSurvey;
                    }
                });
            };
        }
    }, [selectedSurveyId]);

    function handleToggle(id: string) {
        setSelectedContentIds({...selectedContentIds, [id]: !selectedContentIds[id]});
    }

    const anySelected = Object.values(selectedContentIds).some(x => x);
    return (
        <Dialog
            open={isOpen}
            onClose={close}
            scroll="paper"
            fullWidth
        >
            <DialogTitle disableTypography className={classes.dialogTitle}>
                <Typography variant="h6">Import</Typography>
            </DialogTitle>
            <DialogContent dividers>
                {error ? <div>
                    There was an error: {error} <Button onClick={() => {
                        setError(undefined);
                        setSelectedSurveyId(undefined);
                        loadSurveys(surveyId, setSurveys, setError);
                    }}>Try again</Button>
                </div> : <>
                    {surveys === undefined && <div className={classes.loading}>
                        <CircularProgress className={classes.progress} />
                        Loading surveys...
                    </div>}
                    {surveys !== undefined && <div>
                        <div>Importing from: <Select value={selectedSurveyId ?? ''} onChange={(e) => {
                            setSelectedSurveyId(e.target.value as number);
                        }}>
                            {surveys.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                        </Select></div>
                        {selectedSurveyId !== undefined && (survey === undefined ? <div className={classes.loading}>
                            <CircularProgress className={classes.progress} />
                            Loading survey...
                        </div> : <List>
                            {survey.content.map(content => {
                                const labelId = "import-label-" + selectedSurveyId + "-" + content.id;
                                return <ListItem key={content.id} button dense onClick={() => handleToggle(content.id)}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={Boolean(selectedContentIds[content.id])}
                                            tabIndex={-1}
                                            disableRipple
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </ListItemIcon>
                                    <ListItemIcon>
                                        {ContentTypeInfo[content.type].icon}
                                    </ListItemIcon>
                                    <ListItemText id={labelId}>
                                        {content.title}
                                    </ListItemText>
                                </ListItem>;
                            })}
                        </List>
                        )}
                    </div>}
                </>}
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>
                    Cancel
                </Button>
                <Button disabled={!anySelected} onClick={() => {
                    survey?.content && addContent(survey?.content.filter(content => selectedContentIds[content.id]));
                    close();
                }} color="primary">
                    Import
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dialogTitle: {
            display: 'flex',
            flexDirection: 'row',
        },
        loading: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        },
        progress: {
            marginBottom: '2em',
        },
    })
);