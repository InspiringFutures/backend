import React, { forwardRef, FunctionComponent, useContext, useReducer, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import SaveIcon from '@material-ui/icons/Save';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import FormatLineSpacingIcon from '@material-ui/icons/FormatLineSpacing';
import TextFieldsIcon from '@material-ui/icons/TextFields';
import ShortTextIcon from '@material-ui/icons/ShortText';
import { DragHandle } from "@material-ui/icons";
import { RouteComponentProps } from "@reach/router";
import { Button, IconButton, Paper, TextareaAutosize, TextField } from "@material-ui/core";
import {ulid} from "ulid";

import {
    Content,
    SectionHeader,
    TextBlock,
    TextQuestion
} from "./SurveyContent";

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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
            flexGrow: 1,
            padding: theme.spacing(3),
            overflowY: 'scroll',
            height: '100vh',
        },
        contentItem: {
        },
        editorContents: {
            padding: theme.spacing(1),
            paddingTop: 0,
            marginBottom: theme.spacing(3),
        },
        editableInput: {
            font: 'inherit',
            flexGrow: 1,
            marginBottom: 3,
        },
        editableWrapper: {
            display: 'flex',
            alignItems: 'baseline',
        },
        editableHolder: {
            paddingTop: 3,
            paddingLeft: 4,
            border: 'solid 1px transparent',
            '&:hover': {
                borderColor: theme.palette.primary.light,
            },
        },
        editableMultiline: {
            flexGrow: 1,
            display: 'flex',
            alignItems: 'start',
            border: 'solid 1px transparent',
            '&:hover': {
                borderColor: theme.palette.primary.light,
            },
        },
        editableMultilineContents: {
            flexGrow: 1,
        },
        placeholder: {
            color: '#777',
        },
        dragHandle: {
            background: '#fcfcfc',
            textAlign: 'center',
            color: '#ddd',
            '&:hover': {
                color: '#777',
            },
        },
        exampleAnswer: {
            color: '#777',
            borderBottom: 'dotted 1px #777',
        },
    }),
);

interface SurveyEditorProps extends RouteComponentProps
{
    surveyId?: string;
}

interface SurveyInfo {
    name: string;
}

function Spacer({width}: {width?: number}) {
    return <span style={width ? {width} : {flexGrow: 1}} />;
}

type EditableTextProps = {
    text?: string;
    onSave: (newText: string | undefined) => void;
    multiLine?: boolean;
    placeHolder?: string;
};


export const escapedNewLineToLineBreakTag = (string: string) => string.split('\n').map((item: string, index: number) => (index === 0) ? item : [<br key={index} />, item])

function EditableText({text, onSave, multiLine, placeHolder}: EditableTextProps) {
    const classes = useStyles();
    const [isEditing, setEditing] = useState(false);
    const [current, setCurrent] = useState(text ?? "");

    const startEdit = () => {
        setCurrent(text ?? "");
        setEditing(true);
    }

    const cancel = () => {
        setEditing(false);
    };

    const save = () => {
        if (current === undefined || current === "") {
            if (placeHolder) {
                onSave(undefined);
            } else {
                if (text === undefined) {
                    // Empty to start with
                    setEditing(false);
                    return;
                }
                alert("Cannot be empty.");
                return;
            }
        } else {
            onSave(current);
        }
        setEditing(false);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (!multiLine && e.key === "Enter") {
            save();
        } else if (e.key === "Escape") {
            cancel();
        }
    };

    const onBlur = () => {
        setImmediate(() => setEditing((currentlyEditing) => {
            if (currentlyEditing) {
                save();
            }
            return false;
        }));
    };

    return isEditing ?
        <>
            {multiLine ?
                <TextareaAutosize rowsMax={10} autoFocus className={classes.editableInput} value={current}
                      onChange={e => setCurrent(e.target.value)} onKeyUp={handleKey}
                      placeholder={placeHolder} onBlur={onBlur} />
                :
                <input autoFocus className={classes.editableInput} value={current}
                       onChange={e => setCurrent(e.target.value)} onKeyUp={handleKey}
                       placeholder={placeHolder} onBlur={onBlur} />
            }
            <IconButton onClick={cancel}><CancelIcon /></IconButton>
            <IconButton onClick={save}><CheckCircleIcon /></IconButton>
        </>
    : multiLine ?
            <span className={classes.editableMultiline}><span className={classes.editableMultilineContents} onClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : escapedNewLineToLineBreakTag(text)}</span><IconButton onClick={startEdit}><EditIcon /></IconButton></span>
    :
            <span className={classes.editableHolder} onClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : text}<IconButton onClick={startEdit}><EditIcon /></IconButton></span>;
}

type EditorProps<C extends Content> = {
    content: C;
    modify: (newContent: C) => void;
};
type Editor<C extends Content> = FunctionComponent<EditorProps<C>>;

const SectionHeaderEditor: Editor<SectionHeader> = ({content, modify}) => {
    const classes = useStyles();

    return <>
        <Typography variant="h4" className={classes.editableWrapper}>Section: <EditableText text={content.title} onSave={text => modify({...content, title: text})} /></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description of this section" text={content.description} onSave={text => modify({...content, description: text})} /></Typography>
    </>;
};

const TextBlockEditor: Editor<TextBlock> = ({content, modify}) => {
    const classes = useStyles();

    return <Typography className={classes.editableWrapper}><span>Text:</span><Spacer width={8} /><EditableText multiLine text={content.title} onSave={text => modify({...content, title: text})} /></Typography>;
};

const TextQuestionEditor: Editor<TextQuestion> = ({content, modify}) => {
    const classes = useStyles();


    return <>
        <Typography className={classes.editableWrapper}><ShortTextIcon />Short answer question: <EditableText text={content.title} onSave={text => modify({...content, title: text})} /></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description that appears under this question." text={content.description} onSave={text => modify({...content, description: text})} /></Typography>
        <Typography className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeholder} onSave={text => modify({...content, placeholder: text})} /></Typography>
    </>;
};

type ViewerProps<C extends Content> = {
    content: C;
};
type Viewer<C extends Content> = FunctionComponent<ViewerProps<C>>;

const SectionHeaderViewer: Viewer<SectionHeader> = ({content}) => {
    return <>
        <Typography variant="h4">{content.title}</Typography>
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
    </>;
};

const TextBlockViewer: Viewer<TextBlock> = ({content}) => {
    return content.title ? <Typography>{escapedNewLineToLineBreakTag(content.title)}</Typography> : <em>Empty text block</em>;
};

const TextQuestionViewer: Viewer<TextQuestion> = ({content}) => {
    const classes = useStyles();

    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth />
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
        <Typography className={classes.exampleAnswer}>Short answer text</Typography>
    </>;
};

const Editors: {[name in Content["type"]]: Editor<any>} = {
    "SectionHeader": SectionHeaderEditor,
    "TextBlock": TextBlockEditor,
    "TextQuestion": TextQuestionEditor,
};

const Viewers: {[name in Content["type"]]: Viewer<any>} = {
    "SectionHeader": SectionHeaderViewer,
    "TextBlock": TextBlockViewer,
    "TextQuestion": TextQuestionViewer,
};

const ContentEditor = forwardRef<HTMLDivElement, EditorProps<Content> & {draggableProps: any; dragHandleProps:any}>(({content, modify, draggableProps, dragHandleProps}, ref) => {
    const classes = useStyles();

    const {state: editorState, dispatch} = useContext(EditorContext);

    const Editor = Editors[content.type];
    const Viewer = Viewers[content.type];
    return <Paper className={classes.contentItem} ref={ref} {...draggableProps}>
        <div className={classes.dragHandle} {...dragHandleProps}><DragHandle /></div>
        <div className={classes.editorContents}>
            {editorState.activeQuestion === content.id ?
                <Editor content={content as any} modify={modify}/>
            :   <div onClick={() => dispatch({type: 'focus', on: content.id})}>
                    <Viewer content={content as any}/>
                </div>
            }
        </div>
    </Paper>;
});

const sidebarItems: ({index: number; icon: any; name: string; type: Content["type"]} | null)[] = [
    {index: 0, icon: <FormatLineSpacingIcon />, name: "Section", type: "SectionHeader"},
    {index: 1, icon: <TextFieldsIcon />, name: "Explanatory Text", type: "TextBlock"},
    null,
    {index: 2, icon: <ShortTextIcon />, name: "Short answer", type: "TextQuestion"},
];

interface EditorState {
    activeQuestion?: string;
}
type EditorAction =
    | {type: 'focus'; on: string};

function editorReducer(state: EditorState, action: EditorAction) {
    switch (action.type) {
        case "focus":
            return {...state, activeQuestion: action.on};
    }
    return state;
}
interface EditorControl {
    state: EditorState;
    dispatch: (action: EditorAction) => void;
}

const EditorContext = React.createContext<EditorControl>({state: {}, dispatch: () => {
    throw new Error("EditorContext used outside of provider");
}});

export default function SurveyEditor({surveyId}: SurveyEditorProps) {
    const classes = useStyles();

    // Load the survey!
    const [surveyInfo, setSurveyInfo] = useState<SurveyInfo>({name: "Survey " + surveyId});
    const [content, setContent] = useState<Content[]>([
        {type: "SectionHeader", id: "a", title: "Welcome to Inspiring Futures", description: "We have some questions."},
        {type: "TextBlock", id: "b", title: "Here is some text"},
        {type: "TextQuestion", id: "c", title: "What is your name?", description: "Please give a name we can use to talk to you.\nHere is some text\nAnother line\nAnd another"},
        {type: "SectionHeader", id: "d", title: "Welcome to Inspiring Futures"},
    ]);
    const [editorState, editorDispatch] = useReducer(editorReducer, {});

    console.log(content);
    function onDragEnd(drop: DropResult) {
        console.log(drop);
        if (drop.reason === 'CANCEL') {
            return;
        }
        const newContent = content.slice();
        if (drop.source.droppableId === "palette") {
            const type = drop.draggableId as Content["type"];
            newContent.splice(drop.destination?.index!, 0, {type, id: ulid()});
        } else {
            const removed = newContent.splice(drop.source.index, 1);
            newContent.splice(drop.destination?.index!, 0, ...removed);
        }
        setContent(newContent);
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}><div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        {surveyInfo.name}
                    </Typography>
                    <Spacer />
                    <Button variant="contained" startIcon={<UndoIcon />}>
                        Undo
                    </Button>
                    <Spacer width={8} />
                    <Button variant="contained" startIcon={<RedoIcon />}>
                        Redo
                    </Button>
                    <Spacer width={16} />
                    <Button variant="contained" startIcon={<SaveIcon />}>
                        Save
                    </Button>
                </Toolbar>
            </AppBar>
            <Droppable droppableId="main">
                {(provided) =>
                    <main className={classes.content} ref={provided.innerRef}>
                        <Toolbar />
                        <EditorContext.Provider value={{state: editorState, dispatch: editorDispatch}}>
                            {content.map((c, index) => <Draggable key={c.id} draggableId={c.id} index={index}>{(provided) =>
                                <ContentEditor content={c} ref={provided.innerRef} draggableProps={provided.draggableProps} dragHandleProps={provided.dragHandleProps} modify={(newC) => {
                                const newContent = content.slice();
                                newContent.splice(index, 1, newC);
                                setContent(newContent);
                            }} />}</Draggable>)}
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
                <Toolbar />
                <div className={classes.drawerContainer}>
                    <Droppable droppableId="palette" isDropDisabled={true}>
                        {provided =>
                            <List ref={provided.innerRef}>
                                {sidebarItems.map((item, index) => (
                                    item ?
                                        <Draggable key={item.type} draggableId={item.type}
                                                   index={item.index}>
                                            {(provided, snapshot) =>
                                                snapshot.isDragging ?
                                                    <>
                                                        <ListItem button ref={provided.innerRef}
                                                                  {...provided.draggableProps}
                                                                  {...provided.dragHandleProps}>
                                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                                            <ListItemText primary={item.name}/>
                                                        </ListItem>
                                                        <ListItem button>
                                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                                            <ListItemText primary={item.name}/>
                                                        </ListItem>
                                                    </>
                                                :
                                                    <ListItem button ref={provided.innerRef}
                                                              {...provided.draggableProps}
                                                              {...provided.dragHandleProps}>
                                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                                        <ListItemText primary={item.name}/>
                                                    </ListItem>
                                            }
                                        </Draggable>
                                        : <Divider key={index}/>
                                ))}
                                {provided.placeholder}
                            </List>
                        }
                    </Droppable>
                </div>
            </Drawer>
        </div>
        </DragDropContext>
    );
}
