import React, {
    forwardRef,
    FunctionComponent, PropsWithChildren,
    useCallback,
    useContext,
    useEffect, useMemo,
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
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import FormatLineSpacingIcon from '@material-ui/icons/FormatLineSpacing';
import TextFieldsIcon from '@material-ui/icons/TextFields';
import ShortTextIcon from '@material-ui/icons/ShortText';
import DragHandle from "@material-ui/icons/DragHandle";
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import GridOnIcon from '@material-ui/icons/GridOn';
import DeleteIcon from '@material-ui/icons/Delete';
import AssignmentReturnedIcon from '@material-ui/icons/AssignmentReturned';

import { RouteComponentProps } from "@reach/router";
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, FormControl,
    FormControlLabel,
    FormLabel,
    IconButton, Menu,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    TextareaAutosize,
    TextField, Tooltip
} from "@material-ui/core";
import { ulid } from "ulid";

import {
    ChoiceGridQuestion, ChoiceQuestion,
    Content,
    ParagraphQuestion, Question,
    SectionHeader, SurveyContent,
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
        contentItemActive: {
            borderLeft: `solid 5px ${theme.palette.primary.dark}`,
        },
        editorContents: {
            padding: theme.spacing(1),
            paddingTop: 0,
            marginBottom: theme.spacing(3),
        },
        editableOuterWrapper: {
            flexGrow: 1,
            display: 'flex',
            border: 'solid 1px transparent',
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
            border: 'solid 1px transparent',
            flexGrow: 1,
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
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
        },
        editableTextArrayDraggable: {
            display: 'flex',
            flexGrow: 1,
        },
        editableTextArrayDragHandle: {
            alignSelf: 'center',
        },
        questionIcon: {
            transform: 'translateY(5px)',
        },
        editableInlineButton: {
            alignSelf: 'center',
        },
        editableTextArrayAddRow: {
            display: 'flex',
        },
        editableTextArrayAddText: {
            paddingTop: 5,
            paddingBottom: 5,
        },
        editorFooterWrapper: {
            display: 'flex',
            margin: theme.spacing(1),
            marginBottom: 0,
            borderTop: 'solid 1px #ddd',
            paddingTop: theme.spacing(1),
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

const QuestionTypeInfo = {
    "TextQuestion": {icon: <ShortTextIcon />, name: "Short answer"},
    "YesNoQuestion": {icon: <ThumbsUpDownIcon />, name: "Yes/no"},
    "ParagraphQuestion": {icon: <ViewHeadlineIcon />, name: "Paragraph"},
    "ChoiceQuestion": {icon: <RadioButtonCheckedIcon />, name: "Choice"},
    "ChoiceGridQuestion": {icon: <GridOnIcon />, name: "Choice grid"},
};

function Spacer({width}: {width?: number}) {
    return <span style={width ? {width} : {flexGrow: 1}} />;
}

interface SaveOptions {
    movement?: number;
    fromBlur?: boolean;
}

type EditableTextProps = {
    text?: string;
    onSave: (newText: string | undefined, options?: SaveOptions) => void;
    multiLine?: boolean;
    placeHolder?: string;
    onDelete?: (options?: SaveOptions) => void;
    holderClassName?: string;
    autoFocus?: boolean;
    isValid?: (newText: string | undefined) => string | undefined;
};

export const escapedNewLineToLineBreakTag = (string: string) => string.split('\n').map((item: string, index: number) => (index === 0) ? item : [<br key={index} />, item])

type EditableTextState = {isEditing: boolean; value?: string};
type EditableTextAction =
    | {type: "startEdit"}
    | {type: "save"; options?: SaveOptions}
    | {type: "cancel"}
    | {type: "update"; value: string}
    ;

function EditableText({text, onSave, multiLine, placeHolder, onDelete, holderClassName, autoFocus, isValid}: EditableTextProps) {
    const classes = useStyles();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [state, dispatch] = useReducer(useCallback((current: EditableTextState, action: EditableTextAction) => {
        switch (action.type) {
            case 'startEdit':
                if (current.isEditing) {
                    return current;
                }
                return {isEditing: true, value: text ?? ""};
            case 'save':
                if (current.isEditing) {
                    if (current.value === undefined || current.value === "") {
                        if (onDelete) {
                            onDelete(action.options);
                        } else {
                            if (isValid && !!isValid(current.value)) {
                                alert("Not a valid value 1")
                                return current;
                            } else if (placeHolder) {
                                onSave(undefined, action.options);
                            } else {
                                if (text !== undefined) {
                                    // Not empty to start with
                                    alert("Cannot be empty.");
                                }
                                return current;
                            }
                        }
                    } else {
                        if (isValid && !!isValid(current.value)) {
                            alert("Not a valid value 2");
                            return current;
                        }
                        onSave(current.value, action.options);
                    }
                }
                return {isEditing: false};
            case 'cancel':
                return {isEditing: false};
            case 'update':
                return {...current, value: action.value};
        }
    }, [onSave, onDelete, isValid, placeHolder, text]), {isEditing: !!autoFocus});

    useEffect(() => {
        if (autoFocus === true) {
            dispatch({type: 'startEdit'});
        }
    }, [autoFocus]);

    const startEdit = useCallback(() => dispatch({type: 'startEdit'}), []);
    const save = useCallback((options?: SaveOptions) => dispatch({type: 'save', options}), []);
    const cancel = useCallback(() => dispatch({type: 'cancel'}), []);
    const setCurrent = useCallback((value: string) => {
        dispatch({type: 'update', value});
        if (isValid) {
            setErrorMessage(isValid(value));
        }
    }, [isValid]);

    const handleKey = (e: React.KeyboardEvent) => {
        if (!multiLine && e.key === "Enter") {
            save({movement: 1});
        } else if (e.key === "Escape") {
            cancel();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            save({movement: e.key === "ArrowUp" ? -1 : 1});
        }
    };

    const onBlur = (e: React.FocusEvent) => {
        if (wrapperRef.current && wrapperRef.current.contains(e.relatedTarget as Element)) {
            // Inside, so ignore
        } else {
            save({fromBlur: true});
        }
    };

    return state.isEditing ?
        <span className={classes.editableOuterWrapper} ref={wrapperRef}>
            {multiLine ?
                <TextareaAutosize rowsMax={10} autoFocus className={classes.editableInput} value={state.value}
                      onChange={e => setCurrent(e.target.value)} onKeyDown={handleKey}
                      placeholder={placeHolder} onBlur={onBlur} />
                :
                <TextField autoFocus className={classes.editableInput} value={state.value}
                       onChange={e => setCurrent(e.target.value)} onKeyDown={handleKey}
                       placeholder={placeHolder} onBlur={onBlur}
                       error={!!errorMessage} helperText={errorMessage}
                />
            }
            <IconButton className={classes.editableInlineButton} onClick={cancel}><CancelIcon /></IconButton>
            <IconButton className={classes.editableInlineButton} onClick={() => save()}><CheckCircleIcon /></IconButton>
        </span>
    : multiLine ?
            <span className={classes.editableMultiline}><span className={classes.editableMultilineContents} onClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : escapedNewLineToLineBreakTag(text)}</span></span>
    :
            <span className={`${classes.editableHolder} ${holderClassName}`} onClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : text}{onDelete && <IconButton className={classes.editableInlineButton} onClick={() => onDelete()} size="small"><DeleteIcon /></IconButton>}</span>;
}

type EditorProps<C extends Content> = {
    content: C;
    modify: (newContent: SurveyContent|undefined|"duplicate") => void;
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

interface QuestionTypeMenuProps {
    type: Question["type"];
    setType: (type: Question["type"]) => void;
}

function QuestionTypeMenu({type, setType}: QuestionTypeMenuProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, option: Question["type"]) => {
        setType(option);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const selected = QuestionTypeInfo[type];

    return (
        <>
            <List component="nav">
                <ListItem
                    button
                    aria-haspopup="true"
                    onClick={handleClickListItem}
                >
                    <ListItemIcon>{selected.icon}</ListItemIcon>
                    <ListItemText primary="Question type" secondary={selected.name} />
                </ListItem>
            </List>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {Object.keys(QuestionTypeInfo).map((optionAsString, index) => {
                    const option = optionAsString as Question["type"];
                    return (
                        <MenuItem
                            key={option}
                            selected={option === type}
                            onClick={(event) => handleMenuItemClick(event, option)}
                        >
                            <ListItemIcon>{QuestionTypeInfo[option].icon}</ListItemIcon>
                            {QuestionTypeInfo[option].name}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

const QuestionEditor = function<Q extends Question> ({content, modify, children}: PropsWithChildren<EditorProps<Q>>) {
    const classes = useStyles();

    return <>
        <div className={classes.editableWrapper}>
            <EditableText text={content.title} placeHolder="Question" onSave={text => modify({...content, title: text})}/>
            <QuestionTypeMenu type={content.type} setType={(type) => {
                modify({type, title: content.title, description: content.description, id: content.id});
            }} />
        </div>
        <div className={classes.editableWrapper}>
            <span>Description:</span>
            <Spacer width={8}/>
            <EditableText multiLine
                          placeHolder="Additional description that appears under this question."
                          text={content.description}
                          onSave={text => modify({...content, description: text})}/>
        </div>
        {children}
    </>;
};

const TextQuestionEditor: Editor<TextQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeholder} onSave={text => modify({...content, placeholder: text})} /></Typography>
    </QuestionEditor>;
};

const YesNoQuestionEditor: Editor<YesNoQuestion> = (props) => {
    return <QuestionEditor {...props} />
};

const ParagraphQuestionEditor: Editor<ParagraphQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeholder} onSave={text => modify({...content, placeholder: text})} /></Typography>
    </QuestionEditor>;
};

interface EditableTextArrayProps {
    onSave: (newEntries: string[]) => void;
    entries: string[];
    placeholder: string;
}

function EditableTextArray({onSave, entries, placeholder}: EditableTextArrayProps) {
    const [selectedIndex, setSelectedIndex] = useState<number>();
    const classes = useStyles();

    function handleDrag(drop: DropResult) {
        if (drop.reason === 'CANCEL') {
            return;
        }
        const newEntries = [...entries];
        const removed = newEntries.splice(drop.source.index, 1);
        newEntries.splice(drop.destination?.index!, 0, ...removed);
        onSave(newEntries);
        setSelectedIndex(undefined);
    }

    function save(index: number, text: string | undefined, options?: SaveOptions) {
        const newEntries = [...entries];
        if (text === undefined) {
            newEntries.splice(index, 1);
        } else {
            newEntries.splice(index, 1, text);
        }
        onSave(newEntries);
        let newIndex = undefined;
        if (options && options.movement !== undefined) {
            newIndex = index + options.movement;
        }
        setSelectedIndex(newIndex);
    }

    // This is a hack: going up from the top item sets selectedIndex to -1, clearing autoFocus, then
    // this sets it again
    useEffect(() => {
        if (selectedIndex === -1) {
            setSelectedIndex(0);
        }
    }, [selectedIndex]);

    const isValid = (index: number) => (value: string | undefined) => {
        if (value === undefined || value === "") return;
        const foundIndex = entries.findIndex((test, testIndex) => {
            return testIndex !== index && value === test;
        });
        if (foundIndex !== -1) {
            return "Duplicate option";
        }
    };

    return <div>
        <DragDropContext onDragEnd={handleDrag}>
            <Droppable droppableId="editableTextArray">
                {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                    {entries.map((entry, index) => {
                        return <Draggable key={index} draggableId={"D" + index} index={index}>
                            {(provided) =>
                                <div className={classes.editableTextArrayDraggable} ref={provided.innerRef} {...provided.draggableProps}>
                                    <span className={classes.editableTextArrayDragHandle} {...provided.dragHandleProps}><DragHandle /></span>
                                    <EditableText autoFocus={selectedIndex === index} isValid={isValid(index)} text={entry} onSave={(text, options) => save(index, text, options)} onDelete={(options) => save(index, undefined, options)} />
                                </div>
                            }
                        </Draggable>;
                    })}
                    {provided.placeholder}
                </div>)}
            </Droppable>
        </DragDropContext>
        <div className={classes.editableTextArrayAddRow}>
            <EditableText key={entries.length} autoFocus={selectedIndex === entries.length} isValid={isValid(-1)} holderClassName={classes.editableTextArrayAddText} placeHolder={placeholder} onSave={(text) => {
                if (text) {
                    const newEntries = [...entries, text];
                    onSave(newEntries);
                    setSelectedIndex(newEntries.length);
                }
            }}
            />
        </div>
        <Spacer />
    </div>;
}

const ChoiceQuestionEditor: Editor<ChoiceQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <h4>Choices</h4>
                <EditableTextArray placeholder="Add choice" entries={content.choices || []} onSave={(choices) => modify({...content, choices})} />
                <FormControlLabel
                    control={<Checkbox checked={!!content.allowOther} onChange={(e) => modify({...content, allowOther: e.target.checked})} />}
                    label={"Allow user to type an \"Other\" option"}
                />
            </div>
        </div>
    </QuestionEditor>;
};

const ChoiceGridQuestionEditor: Editor<ChoiceGridQuestion> = (props) => {
    const classes = useStyles();

    const {content, modify} = props;

    return <QuestionEditor {...props}>
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
    </QuestionEditor>;
};

type ViewerProps<C extends Content> = {
    content: C;
};
type Viewer<C extends Content> = FunctionComponent<ViewerProps<C>>;

const SectionHeaderViewer: Viewer<SectionHeader> = ({content}) => {
    return <>
        <Typography variant="h4">{content.title ? content.title : <em>Untitled Section</em>}</Typography>
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


const ChoiceQuestionViewer: Viewer<ChoiceQuestion> = ({content}) => {
    const choices = content.choices || [];
    const [value, setValue] = useState("");

    let selectOther = () => setValue("other");
    return <FormControl>
        <FormLabel>{content.title}</FormLabel>
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
        {choices.length > 0 ?
            <RadioGroup value={value} onChange={(e) => setValue(e.currentTarget.value)}>
                {choices.map((choice, index) => <FormControlLabel key={index} value={"c" + index} control={<Radio />} label={choice}/>)}
                {content.allowOther && <FormControlLabel value="other" control={<Radio />} label={<span>Other: <TextField onClick={selectOther} onChange={selectOther} /></span>} />}
            </RadioGroup>
        :   <em>No rows/columns defined</em>
        }
    </FormControl>;
};

const ChoiceGridQuestionViewer: Viewer<ChoiceGridQuestion> = ({content}) => {
    const rows = useMemo(() => content.rows || [], [content.rows]);
    const columns = content.columns || [];

    const [checks, setChecks] = useState<number[]>(() => {
        return Array(rows.length).fill(-1);
    });

    useEffect(() => {
        setChecks((checks) => {
            if (checks.length !== rows.length) {
                return Array(rows.length).fill(-1);
            } else {
                return checks;
            }
        })
    }, [rows]);

    function setChecked(row: number, col: number) {
        const newChecks = [...checks];
        newChecks.splice(row, 1, col);
        setChecks(newChecks);
    }

    function isChecked(row: number, col: number) {
        return checks[row] === col;
    }

    return <>
        <FormLabel>{content.title}</FormLabel>
        {content.description && <Typography>{escapedNewLineToLineBreakTag(content.description)}</Typography>}
        {rows.length > 0 && columns.length > 0 ?
            <table>
                <thead>
                <tr>
                    <td>&nbsp;</td>
                    {columns.map((column, index) => <th key={index}>{column}</th>)}
                </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => <tr key={index}>
                        <th>{row}</th>
                        {columns.map((column, colIndex) => <td key={colIndex}><Radio checked={isChecked(index, colIndex)} onChange={(checked) => setChecked(index, colIndex)} /></td>)}
                    </tr>)}
                </tbody>
            </table>
        :   <em>No rows/columns defined</em>}
    </>;
};

const Editors: {[name in Content["type"]]: Editor<any>} = {
    "SectionHeader": SectionHeaderEditor,
    "TextBlock": TextBlockEditor,
    "TextQuestion": TextQuestionEditor,
    "YesNoQuestion": YesNoQuestionEditor,
    "ParagraphQuestion": ParagraphQuestionEditor,
    "ChoiceQuestion": ChoiceQuestionEditor,
    "ChoiceGridQuestion": ChoiceGridQuestionEditor,
};

const Viewers: {[name in Content["type"]]: Viewer<any>} = {
    "SectionHeader": SectionHeaderViewer,
    "TextBlock": TextBlockViewer,
    "TextQuestion": TextQuestionViewer,
    "YesNoQuestion": YesNoQuestionViewer,
    "ParagraphQuestion": ParagraphQuestionViewer,
    "ChoiceQuestion": ChoiceQuestionViewer,
    "ChoiceGridQuestion": ChoiceGridQuestionViewer,
};

const EditorFooter: Editor<Content> = ({modify}) => {
    const classes = useStyles();
    return <div className={classes.editorFooterWrapper}>
        <Spacer />
        <Tooltip title="Duplicate"><IconButton className={classes.editableInlineButton} onClick={() => modify("duplicate")}><AssignmentReturnedIcon /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton className={classes.editableInlineButton} onClick={() => modify(undefined)}><DeleteIcon /></IconButton></Tooltip>
    </div>;
};

const ContentEditor = forwardRef<HTMLDivElement, EditorProps<Content> & {draggableProps: any; dragHandleProps:any}>(({content, modify, draggableProps, dragHandleProps}, ref) => {
    const classes = useStyles();

    const {state: editorState, dispatch} = useContext(EditorContext);

    const Editor = Editors[content.type];
    const Viewer = Viewers[content.type];
    return <Paper className={`${classes.contentItem} ${editorState.activeQuestion === content.id ? classes.contentItemActive : ''}`} ref={ref} {...draggableProps}>
        <div className={classes.dragHandle} {...dragHandleProps}><DragHandle /></div>
        <div className={classes.editorContents}>
            {editorState.activeQuestion === content.id ?
                <>
                    <Editor content={content as any} modify={modify}/>
                    <EditorFooter  content={content} modify={modify}/>
                </>
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

const ContentTypeInfo = {
    "SectionHeader": {icon: <FormatLineSpacingIcon />, name: "Section"},
    "TextBlock": {icon: <TextFieldsIcon />, name: "Explanatory Text"},
    ...QuestionTypeInfo
};

function getSidebarItems() {
    let index = 0;
    const pick = (type: Content["type"]) => {
        return {index: index++, ...ContentTypeInfo[type], type};
    }
    return [
        pick("SectionHeader"),
        pick("TextBlock"),
        null,
        pick("TextQuestion"),
        pick("YesNoQuestion"),
        pick("ParagraphQuestion"),
        pick("ChoiceQuestion"),
        pick("ChoiceGridQuestion"),
    ];
}

const sidebarItems: ({index: number; icon: any; name: string; type: Content["type"]} | null)[] = getSidebarItems();

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

type UndoAction<T> =
    | {type: 'set'; value: T}
    | {type: 'undo'}
    | {type: 'redo'}
    ;
type UndoState<T> = {
    past: T[];
    present: T;
    future: T[];
}
type UndoReducer<T> = (state: UndoState<T>, action: UndoAction<T>) => UndoState<T>;

// Not a strict reducer, but we know what state is exposed and that this is safe.
const undoReducer = function <T extends any>(state: UndoState<T>, action: UndoAction<T>): UndoState<T> {
    switch (action.type) {
        case 'set':
            if (action.value === state.present) {
                return state;
            }
            state.past.push(state.present);
            return {...state, present: action.value, future: []};
        case 'undo':
            if (state.past.length === 0) {
                return state;
            }
            const last = state.past.pop()!;
            state.future.push(state.present);
            return {...state, present: last};
        case 'redo':
            if (state.future.length === 0) {
                return state;
            }
            const next = state.future.pop()!;
            state.past.push(state.present);
            return {...state, present: next};
    }
    return state;
};

interface UndoActions<T> {
    set: (value: T) => void;
    undo: () => void;
    redo: () => void;
}

interface UndoStack<T> {
    content: T;
    canUndo: boolean;
    canRedo: boolean;
    actions: UndoActions<T>;
}

const useUndoStack = function <T extends any>(initialState: T): UndoStack<T> {
    const initializerArg: UndoState<T> = {
        past: [],
        present: initialState,
        future: []
    };
    const [state, dispatch] = useReducer<UndoReducer<T>>(undoReducer, initializerArg);
    const actions = useMemo(() => {
        return {
            set: (value: T) => dispatch({type: 'set', value}),
            undo: () => dispatch({type: 'undo'}),
            redo: () => dispatch({type: 'redo'}),
        };
    }, []);
    return {
        content: state.present,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        actions,
    };
};


export default function SurveyEditor({surveyId}: SurveyEditorProps) {
    const classes = useStyles();

    // Load the survey!
    const [surveyInfo, setSurveyInfo] = useState<SurveyInfo>({name: "Survey " + surveyId});
    const {content, canUndo, canRedo, actions} = useUndoStack<SurveyContent[]>([
        {"type":"SectionHeader","id":"01EYR3VD73T12BBNDCFXZJDF3F","title":"About the survey","description":"Different arts activities impact people in all sorts of ways depending on their circumstances, and often in unexpected ways. Some of these questions might seem like they don’t apply to your course, but they’ve all come from what other arts participants have said about their experiences. Please answer the questions as honestly as you can, and remember there is no right answer to any of the questions. Unless the question gives a specific time, you should answer for how you generally feel. You can add comments in the boxes or around the page if you would like to. \nThank you so much for taking part in this project. "},
        {"type":"YesNoQuestion","id":"01EYR3VD73T12BBNDCFXZJDF3G","title":"Have you taken part in Arts courses before? (E.g. drama, music, painting, poetry etc.)"},
        {"type":"ParagraphQuestion","id":"01EYR42PTTNAJTZM77FEZX950Y","title":"If yes, please tell us what else you have done"},
        {"type":"ChoiceGridQuestion","id":"01EYR69KRPQNGSWN1E3VVM8R4J","rows":["Creative activity is an important part of my life","I am good at some creative activities","I have skills that would allow me to work in the arts world","I am more myself when doing a creative activity than the rest of the time"],"title":"Please tick to show how much you agree or disagree with the following statements. Answer for how you generally feel.","columns":["Strongly Agree","Agree","Neutral","Disagree","Strongly Disagree"]},
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
            const removed = newContent.splice(drop.source.index, 1);
            id = removed[0].id;
            newContent.splice(drop.destination?.index!, 0, ...removed);
        }
        actions.set(newContent);
        editorDispatch({type: "focus", on: id});
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
                    <Button variant="contained" startIcon={<UndoIcon />} disabled={!canUndo} onClick={() => actions.undo()}>
                        Undo
                    </Button>
                    <Spacer width={8} />
                    <Button variant="contained" startIcon={<RedoIcon />} disabled={!canRedo} onClick={() => actions.redo()}>
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
                            {content.map((c, index) => <Draggable key={c.id} draggableId={c.id} index={index}>
                                {(provided) =>
                                    <ContentEditor content={c} ref={provided.innerRef} draggableProps={provided.draggableProps} dragHandleProps={provided.dragHandleProps} modify={(newC) => {
                                        const newContent = [...content];
                                        let on;
                                        if (newC === "duplicate") {
                                            newC = {...c};
                                            on = newC.id = ulid();
                                            newContent.splice(index + 1, 0, newC);
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
                                    }} />
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
