import React, {
    forwardRef,
    FunctionComponent,
    useCallback,
    useContext,
    useReducer,
    useRef,
    useState
} from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
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
import DragHandle from "@material-ui/icons/DragHandle";
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline';
import GridOnIcon from '@material-ui/icons/GridOn';

import { RouteComponentProps } from "@reach/router";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormLabel,
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    TextareaAutosize,
    TextField
} from "@material-ui/core";
import { ulid } from "ulid";

import {
    ChoiceGridQuestion,
    Content,
    ParagraphQuestion,
    SectionHeader,
    TextBlock,
    TextQuestion,
    YesNoQuestion
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
        editableOuterWrapper: {
            flexGrow: 1,
            display: 'flex',
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
        choiceGridColumns: {
            display: 'flex',
        },
        choiceGridColumn: {
            flexGrow: 1,
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

type EditableTextState = {isEditing: boolean; value?: string};
type EditableTextAction =
    | {type: "startEdit"}
    | {type: "save"}
    | {type: "cancel"}
    | {type: "update"; value: string}
    ;

function EditableText({text, onSave, multiLine, placeHolder}: EditableTextProps) {
    const classes = useStyles();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer((current: EditableTextState, action: EditableTextAction) => {
        switch (action.type) {
            case 'startEdit':
                return {isEditing: true, value: text ?? ""};
            case 'save':
                if (current.isEditing) {
                    if (current.value === undefined || current.value === "") {
                        if (placeHolder) {
                            onSave(undefined);
                        } else {
                            if (text !== undefined) {
                                // Not empty to start with
                                alert("Cannot be empty.");
                                return current;
                            }
                        }
                    } else {
                        onSave(current.value);
                    }
                }
                return {isEditing: false};
            case 'cancel':
                return {isEditing: false};
            case 'update':
                return {...current, value: action.value};
        }
    }, {isEditing: false});

    const startEdit = useCallback(() => dispatch({type: 'startEdit'}), []);
    const save = useCallback(() => dispatch({type: 'save'}), []);
    const cancel = useCallback(() => dispatch({type: 'cancel'}), []);
    const setCurrent = useCallback((value: string) => {
        dispatch({type: 'update', value});
    }, []);

    const handleKey = (e: React.KeyboardEvent) => {
        if (!multiLine && e.key === "Enter") {
            save();
        } else if (e.key === "Escape") {
            cancel();
        }
    };

    const onBlur = (e: React.FocusEvent) => {
        if (wrapperRef.current && wrapperRef.current.contains(e.nativeEvent.relatedTarget as Element)) {
            // Inside, so ignore
        } else {
            save();
        }
    };

    return state.isEditing ?
        <span className={classes.editableOuterWrapper} ref={wrapperRef}>
            {multiLine ?
                <TextareaAutosize rowsMax={10} autoFocus className={classes.editableInput} value={state.value}
                      onChange={e => setCurrent(e.target.value)} onKeyUp={handleKey}
                      placeholder={placeHolder} onBlur={onBlur} />
                :
                <input autoFocus className={classes.editableInput} value={state.value}
                       onChange={e => setCurrent(e.target.value)} onKeyUp={handleKey}
                       placeholder={placeHolder} onBlur={onBlur} />
            }
            <IconButton onClick={cancel}><CancelIcon /></IconButton>
            <IconButton onClick={save}><CheckCircleIcon /></IconButton>
        </span>
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

const YesNoQuestionEditor: Editor<YesNoQuestion> = ({content, modify}) => {
    const classes = useStyles();

    return <>
        <Typography className={classes.editableWrapper}><ThumbsUpDownIcon />Yes/no question: <EditableText text={content.title} onSave={text => modify({...content, title: text})} /></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description that appears under this question." text={content.description} onSave={text => modify({...content, description: text})} /></Typography>
    </>;
};

const ParagraphQuestionEditor: Editor<ParagraphQuestion> = ({content, modify}) => {
    const classes = useStyles();

    return <>
        <Typography className={classes.editableWrapper}><ViewHeadlineIcon />Paragraph question: <EditableText text={content.title} onSave={text => modify({...content, title: text})} /></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description that appears under this question." text={content.description} onSave={text => modify({...content, description: text})} /></Typography>
        <Typography className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeholder} onSave={text => modify({...content, placeholder: text})} /></Typography>
    </>;
};

interface EditableTextArrayProps {
    onSave: (newEntries: string[]) => void;
    entries: string[];
    placeholder: string;
}

function EditableTextArray({onSave, entries, placeholder}: EditableTextArrayProps) {
    return <>
        {entries.map((entry, index) => {
            return <EditableText key={entry} text={entry} onSave={(text) => {
                const newEntries = [...entries];
                if (text === undefined) {
                    newEntries.splice(index, 1);
                } else {
                    newEntries.splice(index, 1, text);
                }
                onSave(newEntries);
            }}/>
        })}
        <EditableText placeHolder={placeholder} onSave={(text) => {
            if (text) {
                const newEntries = [...entries, text];
                onSave(newEntries);
            }
        }}/>
    </>;
}

const ChoiceGridQuestionEditor: Editor<ChoiceGridQuestion> = ({content, modify}) => {
    const classes = useStyles();

    return <>
        <Typography className={classes.editableWrapper}><ThumbsUpDownIcon/>Yes/no
            question: <EditableText text={content.title} onSave={text => modify({
                ...content,
                title: text
            })}/></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8}/>
            <EditableText multiLine
                          placeHolder="Additional description that appears under this question."
                          text={content.description}
                          onSave={text => modify({...content, description: text})}/></Typography>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <h4>Rows</h4>
                <EditableTextArray placeholder="Add row" entries={content.rows || []} onSave={(rows) => modify({...content, rows})} />
            </div>
            <div className={classes.choiceGridColumn}>
                <h4>Columns</h4>
                <EditableTextArray placeholder="Add column" entries={content.columns || []} onSave={(columns) => modify({...content, columns})} />
            </div>
        </div>
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
    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth />
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
    </>;
};

const YesNoQuestionViewer: Viewer<YesNoQuestion> = ({content}) => {
    return <>
        <FormLabel>{content.title}</FormLabel>
        <RadioGroup>
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
        </RadioGroup>
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
    </>;
};

const ParagraphQuestionViewer: Viewer<ParagraphQuestion> = ({content}) => {
    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth multiline rows={4} rowsMax={10} />
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
    </>;
};

const ChoiceGridQuestionViewer: Viewer<ChoiceGridQuestion> = ({content}) => {
    return <>
        <FormLabel>{content.title}</FormLabel>
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
    </>;
};

const Editors: {[name in Content["type"]]: Editor<any>} = {
    "SectionHeader": SectionHeaderEditor,
    "TextBlock": TextBlockEditor,
    "TextQuestion": TextQuestionEditor,
    "YesNoQuestion": YesNoQuestionEditor,
    "ParagraphQuestion": ParagraphQuestionEditor,
    "ChoiceGridQuestion": ChoiceGridQuestionEditor,
};

const Viewers: {[name in Content["type"]]: Viewer<any>} = {
    "SectionHeader": SectionHeaderViewer,
    "TextBlock": TextBlockViewer,
    "TextQuestion": TextQuestionViewer,
    "YesNoQuestion": YesNoQuestionViewer,
    "ParagraphQuestion": ParagraphQuestionViewer,
    "ChoiceGridQuestion": ChoiceGridQuestionViewer,
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

const ContentViewer =({content}: ViewerProps<Content>) => {
    const Viewer = Viewers[content.type];
    return <Viewer content={content as any}/>;
};

const sidebarItems: ({index: number; icon: any; name: string; type: Content["type"]} | null)[] = [
    {index: 0, icon: <FormatLineSpacingIcon />, name: "Section", type: "SectionHeader"},
    {index: 1, icon: <TextFieldsIcon />, name: "Explanatory Text", type: "TextBlock"},
    null,
    {index: 2, icon: <ShortTextIcon />, name: "Short answer", type: "TextQuestion"},
    {index: 3, icon: <ThumbsUpDownIcon />, name: "Yes/no", type: "YesNoQuestion"},
    {index: 4, icon: <ViewHeadlineIcon />, name: "Paragraph", type: "ParagraphQuestion"},
    {index: 5, icon: <GridOnIcon />, name: "Choice grid", type: "ChoiceGridQuestion"},
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

interface InjectedDialogProps {
    isOpen: boolean;
    open(): void;
    close(): void;
}

interface MakeDialogProps {
    children(props: InjectedDialogProps): JSX.Element;
}

interface MakeDialogState {
    isOpen: boolean;
}

class MakeDialog extends React.Component<MakeDialogProps, MakeDialogState> {
    state: MakeDialogState = {
        isOpen: false,
    };

    open = () => {
        this.setState({isOpen: true});
    };

    close = () => {
        this.setState({isOpen: false});
    };

    render() {
        return this.props.children({
            isOpen: this.state.isOpen,
            open: this.open,
            close: this.close,
        });
    }
}

function PreviewDialog({isOpen, close, contents}: (InjectedDialogProps & {contents: Content[]})) {
    const descriptionElementRef = React.useRef<HTMLElement>(null);
    React.useEffect(() => {
        if (isOpen) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [isOpen]);

    return (
            <Dialog
                open={isOpen}
                onClose={close}
                scroll="paper"
                aria-labelledby="scroll-dialog-title"
                aria-describedby="scroll-dialog-description"
            >
                <DialogTitle id="scroll-dialog-title">Preview</DialogTitle>
                <DialogContent dividers>
                    {contents.map(content => <ContentViewer key={content.id} content={content} />)}
                </DialogContent>
                <DialogActions>
                    <Button onClick={close} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
    );
}

export default function SurveyEditor({surveyId}: SurveyEditorProps) {
    const classes = useStyles();

    // Load the survey!
    const [surveyInfo, setSurveyInfo] = useState<SurveyInfo>({name: "Survey " + surveyId});
    const [content, setContent] = useState<Content[]>([
        {"type":"SectionHeader","id":"01EYR3VD73T12BBNDCFXZJDF3F","title":"About the survey","description":"Different arts activities impact people in all sorts of ways depending on their circumstances, and often in unexpected ways. Some of these questions might seem like they don’t apply to your course, but they’ve all come from what other arts participants have said about their experiences. Please answer the questions as honestly as you can, and remember there is no right answer to any of the questions. Unless the question gives a specific time, you should answer for how you generally feel. You can add comments in the boxes or around the page if you would like to. \nThank you so much for taking part in this project. "},
        {"type":"YesNoQuestion","id":"01EYR3VD73T12BBNDCFXZJDF3G","title":"Have you taken part in Arts courses before? (E.g. drama, music, painting, poetry etc.)"},
        {"type":"ParagraphQuestion","id":"01EYR42PTTNAJTZM77FEZX950Y","title":"If yes, please tell us what else you have done"},
    ]);
    const [editorState, editorDispatch] = useReducer(editorReducer, {});
    const previewDialog = useRef<MakeDialog>(null);

    console.log(content, JSON.stringify(content));
    function onDragEnd(drop: DropResult) {
        if (drop.reason === 'CANCEL') {
            return;
        }
        const newContent = content.slice();
        if (drop.source.droppableId === "palette") {
            const type = drop.draggableId as Content["type"];
            const newItem = {type, id: ulid()};
            newContent.splice(drop.destination?.index!, 0, newItem);
            editorDispatch({type: 'focus', on: newItem.id});
        } else {
            const removed = newContent.splice(drop.source.index, 1);
            newContent.splice(drop.destination?.index!, 0, ...removed);
        }
        setContent(newContent);
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}><div className={classes.root}>
            <MakeDialog ref={previewDialog}>{({isOpen, open, close}) => <PreviewDialog isOpen={isOpen} open={open} close={close} contents={content} />}</MakeDialog>
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        {surveyInfo.name}
                    </Typography>
                    <Spacer />
                    <Button variant="contained" onClick={() => previewDialog.current && previewDialog.current.open()}>
                        Preview
                    </Button>
                    <Spacer width={16} />
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
                                // Buggy fix for now!
                                setImmediate(() => setContent(newContent));
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
