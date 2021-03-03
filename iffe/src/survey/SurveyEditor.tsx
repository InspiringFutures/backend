import React, { useReducer, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import SaveIcon from '@material-ui/icons/Save';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';

import { RouteComponentProps } from "@reach/router";
import { Button, createMuiTheme, ThemeProvider } from "@material-ui/core";
import { ulid } from "ulid";

import { Content, SurveyContent, } from "./SurveyContent";
import { Spacer } from "./Spacer";
import { sharedStyles } from "./styles";
import { PreviewDialog } from "./PreviewDialog";
import { MakeDialog } from "./MakeDialog";
import { useUndoStack } from "./useUndoStack";
import { Sidebar } from "./Sidebar";
import { getCountUnder } from "./utils";
import {
    EditorAction,
    EditorContext,
    EditorState
} from "./EditorContext";
import { ContentEditor } from "./Editors";

interface SurveyEditorProps extends RouteComponentProps
{
    surveyId?: string;
}

interface SurveyInfo {
    name: string;
}

function editorReducer(state: EditorState, action: EditorAction) {
    switch (action.type) {
        case "focus":
            return {...state, activeQuestion: action.on};
    }
    return state;
}

export default function SurveyEditor({surveyId}: SurveyEditorProps) {
    const classes = useStyles();

    // Load the survey!
    const [surveyInfo, setSurveyInfo] = useState<SurveyInfo>({name: "Survey " + surveyId});
    const {content, canUndo, canRedo, actions} = useUndoStack<SurveyContent[]>([
        {"type":"SectionHeader","id":"01EYR3VD73T12BBNDCFXZJDF3F","title":"About the survey","description":"Different arts activities impact people in all sorts of ways depending on their circumstances, and often in unexpected ways. Some of these questions might seem like they don’t apply to your course, but they’ve all come from what other arts participants have said about their experiences. Please answer the questions as honestly as you can, and remember there is no right answer to any of the questions. Unless the question gives a specific time, you should answer for how you generally feel. You can add comments in the boxes or around the page if you would like to. \nThank you so much for taking part in this project. "},
        {"type":"YesNoQuestion","id":"01EYR3VD73T12BBNDCFXZJDF3G","title":"Have you taken part in Arts courses before? (E.g. drama, music, painting, poetry etc.)"},
        {"type":"ParagraphQuestion","id":"01EYR42PTTNAJTZM77FEZX950Y","title":"If yes, please tell us what else you have done"},
        {"type":"ChoiceGridQuestion","id":"01EYR69KRPQNGSWN1E3VVM8R4J","rows":["Creative activity is an important part of my life","I am good at some creative activities","I have skills that would allow me to work in the arts world","I am more myself when doing a creative activity than the rest of the time"],"title":"Please tick to show how much you agree or disagree with the following statements. Answer for how you generally feel.","columns":["Strongly Agree","Agree","Neutral","Disagree","Strongly Disagree"]},
        {type: "SectionHeader", id: "01EYV1MK19BXCPVS3YZ40MEQ6B", title: "About You"},
        {type: "TextQuestion", id: "01EYV1R3QMJCSJ105S1BKDDYE4", title: "Describe yourself in three words", placeholder: "You can use anything that makes sense to you."},
        {type: "TextBlock", id: "01EYV22JNZKMQ4FM4SYWA3Q4M6", title: "We’re asking for a bit of info about you so that we can see if some people are less able to access arts programmes in the criminal justice system than others. Please answer as accurately as you can."},
        {type: "ChoiceQuestion", id: "01EYV1MMHQKR057CC41HKNE5C7", title: "Please enter your ethnicity", choices: ["White", "Black", "Asian", "Other"]},
    ]);
    const [editorState, editorDispatch] = useReducer(editorReducer, {});
    const previewDialog = useRef<MakeDialog>(null);

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

    return (<ThemeProvider theme={theme}>
        <DragDropContext onDragEnd={onDragEnd}>
            <div className={classes.root}>
                <MakeDialog ref={previewDialog}>{({isOpen, open, close}) => <PreviewDialog
                    isOpen={isOpen} open={open} close={close} contents={content}/>}</MakeDialog>
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <Typography variant="h6" noWrap>
                            {surveyInfo.name}
                        </Typography>
                        <Spacer/>
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
                        <Button variant="contained" startIcon={<SaveIcon/>}>
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
                        <Sidebar  addItem={(newItem) => {
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
