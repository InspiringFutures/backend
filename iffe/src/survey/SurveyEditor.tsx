import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvided,
    Droppable,
    DropResult
} from 'react-beautiful-dnd';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import SaveIcon from '@material-ui/icons/Save';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { Button, CircularProgress, createMuiTheme, ThemeProvider } from "@material-ui/core";
import { ulid } from "ulid";
import { useSnackbar } from 'notistack';

import { Content, SurveyContent, } from "./SurveyContent";
import { Spacer } from "./Spacer";
import { sharedStyles } from "./styles";
import { PreviewDialog } from "./PreviewDialog";
import { MakeDialog } from "./MakeDialog";
import { useUndoStack } from "./useUndoStack";
import { Sidebar } from "./Sidebar";
import { getCountIncluding, useTriggeredTimer } from "./utils";
import { EditorAction, EditorContext, EditorState } from "./EditorContext";
import { ContentEditor } from "./Editors";
import { saveSurvey, SurveyInfo } from "./api";
import { ImportDialog } from './ImportDialog';
import { ModifyFunction } from "./QuestionEditor";

interface SurveyEditorProps
{
    surveyInfo: SurveyInfo;
}

function editorReducer(state: EditorState, action: EditorAction) {
    switch (action.type) {
        case "focus":
            return {...state, activeQuestion: action.on};
    }
    return state;
}

function useAutoSave<T>(dirty: boolean, content: T, autoSaveCallback: () => void) {
    const [queueAutoSave, cancelAutoSave, flushAutoSave] = useTriggeredTimer(autoSaveCallback);

    useEffect(() => {
        if (dirty) {
            queueAutoSave();
        } else {
            cancelAutoSave();
        }
    }, [dirty, content, queueAutoSave, cancelAutoSave]);

    return flushAutoSave;
}

interface WrapContentEditorParams {
    content: Content;
    provided: DraggableProvided;
    getModifyFor: (index: number) => ModifyFunction;
    index: number;
}

function WrapContentEditor({content, provided, getModifyFor, index}: WrapContentEditorParams) {
    const modify = useMemo(() => getModifyFor(index), [getModifyFor, index]);
    return <ContentEditor content={content} ref={provided.innerRef}
                          draggableProps={provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          modify={modify}/>;
}

export function SurveyEditor({surveyInfo}: SurveyEditorProps) {
    const classes = useStyles();

    const {content, canUndo, canRedo, actions, dirty} = useUndoStack<SurveyContent[]>(surveyInfo.content);
    const [editorState, editorDispatch] = useReducer(editorReducer, {});
    const previewDialog = useRef<MakeDialog>(null);
    const importDialog = useRef<MakeDialog>(null);
    const {enqueueSnackbar} = useSnackbar();
    const [saving, setSaving] = useState(false);

    const flushAutoSave = useAutoSave(dirty, content,  () => {
        save(true);
    });

    useEffect(() => {
        function unload(e: BeforeUnloadEvent) {
            if (actions.getDirty()) {
                flushAutoSave();
                e.preventDefault();
                return e.returnValue = "There are unsaved changes";
            }
        }
        function visibilityChange() {
            if (document.visibilityState !== 'visible') {
                if (actions.getDirty()) {
                    flushAutoSave();
                }
            }
        }
        window.addEventListener("beforeunload", unload);
        document.addEventListener("visibilitychange", visibilityChange);
        return () => {
            window.removeEventListener("beforeunload", unload);
            document.removeEventListener("visibilitychange", visibilityChange);
        };
    }, [actions, flushAutoSave]);

    function onDragEnd(drop: DropResult) {
        if (drop.reason === 'CANCEL') {
            return;
        }
        const newContent = [...content];
        let id;
        if (drop.source.droppableId === "palette") {
            const type = drop.draggableId as Content["type"];
            id = ulid();
            const newItem = {type, id};
            newContent.splice(drop.destination?.index!, 0, newItem);
            editorDispatch({type: 'focus', on: newItem.id});
        } else {
            const removed = newContent.splice(drop.source.index, getCountIncluding(content, drop.source.index));
            id = removed[0].id;
            newContent.splice(drop.destination?.index!, 0, ...removed);
        }
        actions.set(newContent);
        editorDispatch({type: "focus", on: id});
    }

    const hasSingleSection = content.filter(c => c.type === 'SectionHeader').length === 1;

    function addContent(addedContent: SurveyContent[]) {
        let firstId: string | undefined;
        const newContent = [...content, ...addedContent.map(content => {
            // Re-id content
            const id = ulid();
            if (!firstId) firstId = id;
            return {...content, originId: content.id, id};
        })];
        actions.set(newContent);
        if (firstId) {
            editorDispatch({type: "focus", on: firstId});
        }
    }

    const saveAync = async (isAuto?: boolean) => {
        try {
            const {success, message} = await saveSurvey(surveyInfo.id, content, !!isAuto);
            if (success) {
                actions.clearDirty();
            }
            enqueueSnackbar(isAuto ? <div><b>Auto-save</b><br />{message}</div> : message,
                {variant: isAuto ? success ? 'info' : 'warning' : success ? 'success' : 'error'});
        } finally {
            setSaving(false);
        }
    };

    const save = (isAuto?: boolean) => {
        setSaving((isSaving) => {
            if (!isSaving) {
                saveAync(isAuto);
            }
            return true;
        });
    };

    const getModifyFor = useMemo(() => (index: number) => {
        const modify: ModifyFunction = (newC, options) => {
            const newContent = [...content];
            let on: string | undefined;
            if (newC === "duplicate") {
                const sectionCount = getCountIncluding(content, index);
                const dupCount = options && options.sectionOnly ? 1 : sectionCount;
                const toAdd = [];
                for (let i = index; i < index + dupCount; i++) {
                    const newC = JSON.parse(JSON.stringify(content[i]));
                    newC.id = ulid();
                    if (on === undefined) {
                        on = newC.id;
                    }
                    toAdd.push(newC);
                }
                newContent.splice(index + sectionCount, 0, ...toAdd);
            } else if (newC === undefined) {
                const sectionCount = getCountIncluding(content, index);
                const deleteCount = options && options.sectionOnly ? 1 : sectionCount;
                newContent.splice(index, deleteCount);
                if (newContent[index]) {
                    on = newContent[index].id;
                }
            } else {
                newContent.splice(index, 1, newC);
            }
            actions.set(newContent);
            if (on) {
                editorDispatch({type: "focus", on});
            }
        };
        return modify;
    }, [actions, content]);

    return (<ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={onDragEnd}>
            <div className={classes.root}>
                <MakeDialog ref={previewDialog}>{({isOpen, open, close}) => <PreviewDialog
                    isOpen={isOpen} open={open} close={close} contents={content}/>}</MakeDialog>
                <MakeDialog ref={importDialog}>{({isOpen, open, close}) => <ImportDialog
                    isOpen={isOpen} open={open} close={close}  addContent={addContent} surveyId={surveyInfo.id}/>}</MakeDialog>
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        {window.history.length > 0 && <Button
                            onClick={() => window.history.back()}>
                            <ArrowBackIcon className={classes.backArrow}/>
                        </Button>}
                        <Spacer width={16}/>
                        <Typography variant="h6" noWrap>
                            {surveyInfo.name}
                        </Typography>
                        <Spacer/>
                        <Button variant="contained"
                                onClick={() => importDialog.current && importDialog.current.open()}>
                            Import
                        </Button>
                        <Spacer width={16}/>
                        <Button variant="contained"
                                onClick={() => previewDialog.current && previewDialog.current.open()}>
                            Preview
                        </Button>
                        <Spacer width={16}/>
                        <Button variant="contained" startIcon={<UndoIcon/>} disabled={!canUndo}
                                onClick={() => actions.undo()}>
                            Undo
                        </Button>
                        <Spacer width={8}/>
                        <Button variant="contained" startIcon={<RedoIcon/>} disabled={!canRedo}
                                onClick={() => actions.redo()}>
                            Redo
                        </Button>
                        <Spacer width={16}/>
                        <Button variant="contained" startIcon={saving ? <CircularProgress /> : <SaveIcon/>} disabled={!dirty || saving} onClick={() => save()}>
                            {saving ? "Saving": "Save"}
                        </Button>
                    </Toolbar>
                </AppBar>
                <Droppable droppableId="main">
                    {(provided) =>
                        <main className={classes.content} ref={provided.innerRef}>
                            <EditorContext.Provider value={{
                                state: editorState,
                                dispatch: editorDispatch,
                                hasSingleSection
                            }}>
                                {content.map((c, index) => <Draggable key={c.id} draggableId={c.id}
                                                                      index={index}
                                                                      isDragDisabled={hasSingleSection && c.type === 'SectionHeader'}>
                                    {(provided) =>
                                        <WrapContentEditor content={c} provided={provided} getModifyFor={getModifyFor} index={index} />
                                    }</Draggable>)}
                            </EditorContext.Provider>
                            {provided.placeholder}
                            {content.length === 0 && <div className={classes.introductionWrapper}>
                                <div>
                                    <h4>Welcome to the Inspiring Futures Survey Editor</h4>
                                    <p>Add questions by:</p>
                                    <ul>
                                        <li>clicking on the type of question you want from the palette on the right,</li>
                                        <li>dragging questions from the palette on the right, or</li>
                                        <li>clicking 'Import' to bring in questions from another survey.</li>
                                    </ul>
                                </div>
                            </div>}
                        </main>
                    }
                </Droppable>
                <Drawer
                    className={classes.drawer}
                    variant="permanent"
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                    anchor="right"
                >
                    <Toolbar/>
                    <div className={classes.drawerContainer}>
                        <Sidebar addItem={(newItem) => {
                            const newContent = [...content, newItem];
                            actions.set(newContent);
                            editorDispatch({type: "focus", on: newItem.id});
                        }}/>
                    </div>
                </Drawer>
            </div>
        </DragDropContext>
    </ThemeProvider>);
}

const drawerWidth = 240;

const theme = createMuiTheme({
    overrides: {
        MuiFormLabel: {
            root: {
                color: '#000',
            },
        },
    },
});

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        ...sharedStyles,
        root: {
            display: 'flex',
        },
        appBar: {
            zIndex: theme.zIndex.drawer + 1,
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
            overflow: 'hidden',
        },
        drawerPaper: {
            width: drawerWidth,
            overflow: 'hidden',
            overflowY: 'hidden',
        },
        drawerContainer: {
            overflow: 'auto',
        },
        content: {
            position: 'absolute',
            top: 64,
            bottom: 0,
            left: 0,
            right: drawerWidth,
            padding: theme.spacing(2),
            overflowY: 'scroll',
        },
        backArrow: {
            color: theme.palette.primary.contrastText,
        },
        introductionWrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        },
    }),
);
