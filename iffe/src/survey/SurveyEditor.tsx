import React, { useReducer, useRef } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import SaveIcon from '@material-ui/icons/Save';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import { Button, createMuiTheme, ThemeProvider } from "@material-ui/core";
import { ulid } from "ulid";
import { useSnackbar } from 'notistack';

import { Content, SurveyContent, } from "./SurveyContent";
import { Spacer } from "./Spacer";
import { sharedStyles } from "./styles";
import { PreviewDialog } from "./PreviewDialog";
import { MakeDialog } from "./MakeDialog";
import { useUndoStack } from "./useUndoStack";
import { Sidebar } from "./Sidebar";
import { getCountUnder } from "./utils";
import { EditorAction, EditorContext, EditorState } from "./EditorContext";
import { ContentEditor } from "./Editors";
import { SurveyInfo } from "./api";
import { ImportDialog } from './ImportDialog';

interface SurveyEditorProps
{
    surveyInfo: SurveyInfo;
    saveContent: (content: SurveyContent[]) => Promise<{message: string; success: boolean}>;
}

function editorReducer(state: EditorState, action: EditorAction) {
    switch (action.type) {
        case "focus":
            return {...state, activeQuestion: action.on};
    }
    return state;
}

export function SurveyEditor({surveyInfo, saveContent}: SurveyEditorProps) {
    const classes = useStyles();

    const {content, canUndo, canRedo, actions, dirty} = useUndoStack<SurveyContent[]>(surveyInfo.content);
    const [editorState, editorDispatch] = useReducer(editorReducer, {});
    const previewDialog = useRef<MakeDialog>(null);
    const importDialog = useRef<MakeDialog>(null);
    const { enqueueSnackbar } = useSnackbar();

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
            const removed = newContent.splice(drop.source.index, getCountUnder(content, drop.source.index));
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

    return (<ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={onDragEnd}>
            <div className={classes.root}>
                <MakeDialog ref={previewDialog}>{({isOpen, open, close}) => <PreviewDialog
                    isOpen={isOpen} open={open} close={close} contents={content}/>}</MakeDialog>
                <MakeDialog ref={importDialog}>{({isOpen, open, close}) => <ImportDialog
                    isOpen={isOpen} open={open} close={close}  addContent={addContent} surveyId={surveyInfo.id}/>}</MakeDialog>
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
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
                        <Button variant="contained" startIcon={<SaveIcon/>} disabled={!dirty} onClick={() => {
                            saveContent(content).then(({success, message}) => {
                                if (success) {
                                    actions.clearDirty();
                                }
                                enqueueSnackbar(message, {variant: success ? 'success' : 'error'});
                            });
                        }}>
                            Save
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
                                        <ContentEditor content={c} ref={provided.innerRef}
                                                       draggableProps={provided.draggableProps}
                                                       dragHandleProps={provided.dragHandleProps}
                                                       modify={(newC) => {
                                                           const newContent = [...content];
                                                           let on: string | undefined;
                                                           if (newC === "duplicate") {
                                                               const dupCount = getCountUnder(content, index);
                                                               const toAdd = [];
                                                               for (let i = index; i < index + dupCount; i++) {
                                                                   const newC = JSON.parse(JSON.stringify(content[i]));
                                                                   newC.id = ulid();
                                                                   if (on === undefined) {
                                                                       on = newC.id;
                                                                   }
                                                                   toAdd.push(newC);
                                                               }
                                                               newContent.splice(index + dupCount, 0, ...toAdd);
                                                           } else if (newC === undefined) {
                                                               newContent.splice(index, 1);
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
                                                       }}/>
                                    }</Draggable>)}
                            </EditorContext.Provider>
                            {provided.placeholder}
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
    }),
);
