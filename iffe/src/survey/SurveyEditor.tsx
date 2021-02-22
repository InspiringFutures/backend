import React, {
    forwardRef,
    FunctionComponent,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
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
import FilterNoneIcon from '@material-ui/icons/FilterNone';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import SmartphoneIcon from '@material-ui/icons/Smartphone';
import TabletIcon from '@material-ui/icons/Tablet';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

import { RouteComponentProps } from "@reach/router";
import {
    Button,
    Checkbox, createMuiTheme,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    TextareaAutosize,
    TextField,
    ThemeProvider,
    Tooltip
} from "@material-ui/core";
import { ulid } from "ulid";

import {
    CheckboxGridQuestion,
    CheckboxQuestion,
    ChoiceGridQuestion,
    ChoiceQuestion,
    Content, isQuestion, isSectionHeader,
    ParagraphQuestion,
    Question,
    SectionHeader,
    SurveyContent, SurveyQuestion,
    TextBlock,
    TextQuestion,
    YesNoQuestion
} from "./SurveyContent";

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
        contentItem: {
        },
        contentItemActive: {
            borderLeft: `solid 5px ${theme.palette.primary.dark}`,
        },
        contentItemSection: {},
        contentItemChild: {
            marginLeft: theme.spacing(3),
        },
        questionEditor: {
            display: 'flex',
            flexDirection: 'row',
        },
        questionEditorTitleDesc: {
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
        },
        questionEditorTitle: {
            fontSize: 20,
        },
        editorContents: {
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2),
            marginBottom: theme.spacing(2),
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
        editableInputInner: {
            font: 'inherit',
        },
        editableWrapper: {
            display: 'flex',
            alignItems: 'baseline',
        },
        editableHolder: {
            border: 'solid 1px transparent',
            flexGrow: 1,
            display: 'flex',
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
            width: 31,
            color: '#ddd',
            '&:hover': {
                color: '#777',
            },
        },
        questionIcon: {
            transform: 'translateY(5px)',
        },
        editableInlineButton: {
            alignSelf: 'center',
        },
        editableTextArrayHeading: {
            marginLeft: 31,
            fontWeight: 'bold',
        },
        editableTextArrayAddRow: {
            display: 'flex',
            marginLeft: 31,
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
        },
        editorClosedWrapper: {
            paddingBottom: theme.spacing(1),
        },
        questionTypeMenu: {
            padding: 0,
        },
        previewTitle: {
            display: 'flex',
            flexDirection: 'row',
        },
        description: {
            color: '#37474f',
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
    "CheckboxQuestion": {icon: <CheckBoxIcon />, name: "Checkboxes"},
    "ChoiceGridQuestion": {icon: <DragIndicatorIcon />, name: "Choice grid"},
    "CheckboxGridQuestion": {icon: <GridOnIcon />, name: "Checkbox grid"},
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
                                alert("Not a valid value")
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
                            alert("Not a valid value");
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
                       InputProps={{className: classes.editableInputInner}}
                />
            }
            <IconButton className={classes.editableInlineButton} onClick={cancel}><CancelIcon /></IconButton>
            <IconButton className={classes.editableInlineButton} onClick={() => save()}><CheckCircleIcon /></IconButton>
        </span>
    : multiLine ?
            <span className={classes.editableMultiline}><span className={classes.editableMultilineContents} onClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : escapedNewLineToLineBreakTag(text)}</span></span>
    :
            <span className={`${classes.editableHolder} ${holderClassName}`} onClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : text}<Spacer />{onDelete && <IconButton className={classes.editableInlineButton} onClick={() => onDelete()} size="small"><DeleteIcon /></IconButton>}</span>;
}

type EditorProps<C extends Content> = {
    content: C;
    modify: (newContent: SurveyContent|undefined|"duplicate") => void;
};
type Editor<C extends Content> = FunctionComponent<EditorProps<C>>;

const SectionHeaderEditor: Editor<SectionHeader> = ({content, modify}) => {
    const classes = useStyles();
    const {hasSingleSection} = useContext(EditorContext);

    return <>
        <Typography variant="h4" className={classes.editableWrapper}>{!hasSingleSection && "Section: "}<EditableText placeHolder="Title" text={content.title} onSave={text => modify({...content, title: text})} /></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description of this section" text={content.description} onSave={text => modify({...content, description: text})} /></Typography>
    </>;
};

const TextBlockEditor: Editor<TextBlock> = ({content, modify}) => {
    const classes = useStyles();

    return <Typography className={classes.editableWrapper}><span>Text:</span><Spacer width={8} /><EditableText placeHolder="Explantory text" multiLine text={content.title} onSave={text => modify({...content, title: text})} /></Typography>;
};

interface QuestionTypeMenuProps {
    type: Question["type"];
    setType: (type: Question["type"]) => void;
}

function QuestionTypeMenu({type, setType}: QuestionTypeMenuProps) {
    const classes = useStyles();

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
            <List component="nav" className={classes.questionTypeMenu}>
                <ListItem
                    button
                    aria-haspopup="true"
                    onClick={handleClickListItem}
                    className={classes.questionTypeMenu}
                >
                    <ListItemIcon>{selected.icon}</ListItemIcon>
                    <ListItemText primary={selected.name} />
                    <ListItemIcon><ArrowDropDownIcon /></ListItemIcon>
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

const QuestionEditor = function({content, modify, children}: PropsWithChildren<EditorProps<SurveyQuestion>>) {
    const classes = useStyles();

    return <>
        <div className={classes.questionEditor}>
            <div className={classes.questionEditorTitleDesc}>
                <div className={classes.questionEditorTitle}>
                    <EditableText text={content.title} placeHolder="Question" onSave={text => modify({...content, title: text})}/>
                </div>
                <Typography variant="body1" className={classes.editableWrapper}>
                    <span>Description:</span>
                    <Spacer width={8}/>
                    <EditableText multiLine
                                  placeHolder="Additional description that appears under this question."
                                  text={content.description}
                                  onSave={text => modify({...content, description: text})}/>
                </Typography>
            </div>
            <div>
                <QuestionTypeMenu type={content.type} setType={(type) => {
                    let choices = undefined;
                    let allowOther = undefined;
                    let rows = undefined;
                    let placeholder = undefined;
                    switch (content.type) {
                        case "CheckboxQuestion":
                        case "ChoiceQuestion":
                            choices = content.choices;
                            allowOther = content.allowOther;
                            break;
                        case "ChoiceGridQuestion":
                        case "CheckboxGridQuestion":
                            choices = content.columns;
                            rows = content.rows;
                            break;
                        case "YesNoQuestion":
                            choices = ["No", "Yes"];
                            break;
                        case "TextQuestion":
                        case "ParagraphQuestion":
                            placeholder = content.placeholder;
                    }
                    const newContent: SurveyQuestion = {type, title: content.title, description: content.description, id: content.id};
                    switch (newContent.type) {
                        case "CheckboxQuestion":
                        case "ChoiceQuestion":
                            newContent.choices = choices;
                            newContent.allowOther = allowOther;
                            break;
                        case "ChoiceGridQuestion":
                        case "CheckboxGridQuestion":
                            newContent.columns = choices;
                            newContent.rows = rows;
                            break;
                        case "TextQuestion":
                        case "ParagraphQuestion":
                            newContent.placeholder = placeholder;
                    }
                    modify(newContent);
                }} />
            </div>
        </div>
        {children}
    </>;
};

const TextQuestionEditor: Editor<TextQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography variant="body1" className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeholder} onSave={text => modify({...content, placeholder: text})} /></Typography>
    </QuestionEditor>;
};

const YesNoQuestionEditor: Editor<YesNoQuestion> = (props) => {
    return <QuestionEditor {...props} />
};

const ParagraphQuestionEditor: Editor<ParagraphQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography variant="body1" className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeholder} onSave={text => modify({...content, placeholder: text})} /></Typography>
    </QuestionEditor>;
};

interface EditableTextArrayProps {
    onSave: (newEntries: string[]) => void;
    entries: string[];
    placeholder: string;
    heading: string;
}

function EditableTextArray({onSave, entries, placeholder, heading}: EditableTextArrayProps) {
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

    return <Typography variant="body1">
        <div className={classes.editableTextArrayHeading}>{heading}</div>
        <DragDropContext onDragEnd={handleDrag}>
            <Droppable droppableId="editableTextArray">
                {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                    {entries.map((entry, index) => {
                        return <Draggable key={index} draggableId={"D" + index} index={index}>
                            {(provided) =>
                                <div className={classes.editableTextArrayDraggable} ref={provided.innerRef} {...provided.draggableProps}>
                                    <span className={classes.editableTextArrayDragHandle} {...provided.dragHandleProps}><DragIndicatorIcon /></span>
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
    </Typography>;
}

const ChoiceQuestionEditor: Editor<ChoiceQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Choices" placeholder="Add choice" entries={content.choices || []} onSave={(choices) => modify({...content, choices})} />
                <FormControlLabel
                    control={<Checkbox checked={!!content.allowOther} onChange={(e) => modify({...content, allowOther: e.target.checked})} />}
                    label={"Allow user to type an \"Other\" choice"}
                />
            </div>
        </div>
    </QuestionEditor>;
};

const CheckboxQuestionEditor: Editor<CheckboxQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Options" placeholder="Add option" entries={content.choices || []} onSave={(choices) => modify({...content, choices})} />
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
                <EditableTextArray heading="Rows" placeholder="Add row" entries={content.rows || []} onSave={(rows) => modify({...content, rows})} />
            </div>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Columns" placeholder="Add column" entries={content.columns || []} onSave={(columns) => modify({...content, columns})} />
            </div>
        </div>
    </QuestionEditor>;
};

const CheckboxGridQuestionEditor: Editor<CheckboxGridQuestion> = (props) => {
    const classes = useStyles();

    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Rows" placeholder="Add row" entries={content.rows || []} onSave={(rows) => modify({...content, rows})} />
            </div>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Columns" placeholder="Add column" entries={content.columns || []} onSave={(columns) => modify({...content, columns})} />
            </div>
        </div>
    </QuestionEditor>;
};

type ViewerProps<C extends Content> = {
    content: C;
};
type Viewer<C extends Content> = FunctionComponent<ViewerProps<C>>;

const Description: Viewer<Content> = ({content}) => {
    const classes = useStyles();
    return content.description ?
        <Typography className={classes.description}>{escapedNewLineToLineBreakTag(content.description)}</Typography>
        : null;
};

const SectionHeaderViewer: Viewer<SectionHeader> = ({content}) => {
    return <>
        <Typography variant="h4">{content.title ? content.title : <em>Untitled Section</em>}</Typography>
        <Description content={content} />
    </>;
};

const TextBlockViewer: Viewer<TextBlock> = ({content}) => {
    return content.title ? <Typography>{escapedNewLineToLineBreakTag(content.title)}</Typography> : <em>Empty text block</em>;
};

const TextQuestionViewer: Viewer<TextQuestion> = ({content}) => {
    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth />
        <Description content={content} />
    </>;
};

const YesNoQuestionViewer: Viewer<YesNoQuestion> = ({content}) => {
    return <>
        <FormLabel>{content.title}</FormLabel>
        <RadioGroup>
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
        </RadioGroup>
        <Description content={content} />
    </>;
};

const ParagraphQuestionViewer: Viewer<ParagraphQuestion> = ({content}) => {
    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth multiline rows={4} rowsMax={10} />
        <Description content={content} />
    </>;
};


const ChoiceQuestionViewer: Viewer<ChoiceQuestion> = ({content}) => {
    const choices = content.choices || [];
    const [value, setValue] = useState("");

    let selectOther = () => setValue("other");
    return <FormControl>
        <FormLabel>{content.title}</FormLabel>
        <Description content={content} />
        {choices.length > 0 ?
            <RadioGroup value={value} onChange={(e) => setValue(e.currentTarget.value)}>
                {choices.map((choice, index) => <FormControlLabel key={index} value={"c" + index} control={<Radio />} label={choice}/>)}
                {content.allowOther && <FormControlLabel value="other" control={<Radio />} label={<span>Other: <TextField onClick={selectOther} onChange={selectOther} /></span>} />}
            </RadioGroup>
        :   <em>No choices defined</em>
        }
    </FormControl>;
};

const CheckboxQuestionViewer: Viewer<CheckboxQuestion> = ({content}) => {
    const choices = content.choices || [];
    const [otherChecked, setOtherChecked] = useState(false);

    const otherRef = useRef<HTMLInputElement>(null);

    return <FormControl>
        <FormLabel>{content.title}</FormLabel>
        <Description content={content} />
        {choices.length > 0 ?
            <>
                {choices.map((choice, index) => <FormControlLabel key={index} value={"c" + index} control={<Checkbox />} label={choice}/>)}
                {content.allowOther && <FormControlLabel value="other" checked={otherChecked} onChange={(e, checked) => {
                    setOtherChecked(checked);
                    if (checked && otherRef.current) otherRef.current.focus();
                }} control={<Checkbox />} label={<span>Other: <TextField onChange={(e) => {
                    if (e.target.value !== "") {
                        setOtherChecked(true);
                    }
                }} inputRef={otherRef} /></span>} />}
            </>
            :   <em>No options defined</em>
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
        <Description content={content} />
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

const CheckboxGridQuestionViewer: Viewer<CheckboxGridQuestion> = ({content}) => {
    const rows = content.rows || [];
    const columns = content.columns || [];

    return <>
        <FormLabel>{content.title}</FormLabel>
        <Description content={content} />
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
                    {columns.map((column, colIndex) => <td key={colIndex}><Checkbox /></td>)}
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
    "CheckboxQuestion": CheckboxQuestionEditor,
    "ChoiceGridQuestion": ChoiceGridQuestionEditor,
    "CheckboxGridQuestion": CheckboxGridQuestionEditor,
};

const Viewers: {[name in Content["type"]]: Viewer<any>} = {
    "SectionHeader": SectionHeaderViewer,
    "TextBlock": TextBlockViewer,
    "TextQuestion": TextQuestionViewer,
    "YesNoQuestion": YesNoQuestionViewer,
    "ParagraphQuestion": ParagraphQuestionViewer,
    "ChoiceQuestion": ChoiceQuestionViewer,
    "CheckboxQuestion": CheckboxQuestionViewer,
    "ChoiceGridQuestion": ChoiceGridQuestionViewer,
    "CheckboxGridQuestion": CheckboxGridQuestionViewer,
};

const EditorFooter: Editor<Content> = ({content, modify}) => {
    const classes = useStyles();
    const {hasSingleSection} = useContext(EditorContext);

    return <div className={classes.editorFooterWrapper}>
        <Spacer />
        <Tooltip title="Duplicate"><IconButton className={classes.editableInlineButton} onClick={() => modify("duplicate")}><FilterNoneIcon /></IconButton></Tooltip>
        {(content.type !== 'SectionHeader' || !hasSingleSection) && <Tooltip title="Delete"><IconButton className={classes.editableInlineButton} onClick={() => modify(undefined)}><DeleteIcon /></IconButton></Tooltip>}
    </div>;
};

const ContentEditor = forwardRef<HTMLDivElement, EditorProps<Content> & {draggableProps: any; dragHandleProps:any}>(({content, modify, draggableProps, dragHandleProps}, ref) => {
    const classes = useStyles();

    const {state: editorState, dispatch} = useContext(EditorContext);

    const refCopy = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (editorState.activeQuestion === content.id && refCopy.current) {
            if ('scrollIntoViewIfNeeded' in refCopy.current) {
                // @ts-ignore
                refCopy.current.scrollIntoViewIfNeeded();
            } else {
                refCopy.current.scrollIntoView();
            }
        }
    }, [editorState.activeQuestion, content.id]);

    const wrapRef = (refValue: HTMLDivElement | null) => {
        refCopy.current = refValue;
        if (ref) {
            if ('current' in ref) {
                ref.current = refValue;
            } else {
                ref(refValue);
            }
        }
    };

    const Editor = Editors[content.type];
    const Viewer = Viewers[content.type];
    return <Paper className={`${classes.contentItem} ${editorState.activeQuestion === content.id ? classes.contentItemActive : ''} ${content.type === 'SectionHeader' ? classes.contentItemSection : classes.contentItemChild}`}
                  ref={wrapRef} {...draggableProps}
                  onClick={() => {
                      if (editorState.activeQuestion !== content.id) {
                          dispatch({type: 'focus', on: content.id});
                      }
                  }}>
        {dragHandleProps !== null && <div className={classes.dragHandle} {...dragHandleProps}><DragHandle /></div>}
        <div className={classes.editorContents}>
            {editorState.activeQuestion === content.id ?
                <>
                    <Editor content={content as any} modify={modify}/>
                    <EditorFooter  content={content} modify={modify}/>
                </>
            :   <div className={classes.editorClosedWrapper}>
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
        pick("CheckboxQuestion"),
        pick("ChoiceGridQuestion"),
        pick("CheckboxGridQuestion"),
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
    hasSingleSection: boolean;
}

const EditorContext = React.createContext<EditorControl>({state: {}, dispatch: () => {
    throw new Error("EditorContext used outside of provider");
}, hasSingleSection: true});

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

interface PreviewTypeMenuProps {
    type: "mobile" | "tablet";
    setType: (type: PreviewTypeMenuProps["type"]) => void;
}

const PreviewTypeInfo = {
    mobile: {icon: <SmartphoneIcon />,name: "Mobile"},
    tablet: {icon: <TabletIcon /> ,name: "Tablet"},
};

function PreviewTypeMenu({type, setType}: PreviewTypeMenuProps) {
    const classes = useStyles();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, option: PreviewTypeMenuProps["type"]) => {
        setType(option);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const selected = PreviewTypeInfo[type];

    return (
        <>
            <List component="nav" className={classes.questionTypeMenu}>
                <ListItem
                    button
                    aria-haspopup="true"
                    onClick={handleClickListItem}
                    className={classes.questionTypeMenu}
                >
                    <ListItemIcon>{selected.icon}</ListItemIcon>
                    <ListItemText primary={selected.name} />
                    <ListItemIcon><ArrowDropDownIcon /></ListItemIcon>
                </ListItem>
            </List>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {Object.keys(PreviewTypeInfo).map((optionAsString, index) => {
                    const option = optionAsString as PreviewTypeMenuProps["type"];
                    return (
                        <MenuItem
                            key={option}
                            selected={option === type}
                            onClick={(event) => handleMenuItemClick(event, option)}
                        >
                            <ListItemIcon>{PreviewTypeInfo[option].icon}</ListItemIcon>
                            {PreviewTypeInfo[option].name}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

function PreviewTablet({contents}: {contents: Content[]}) {
    let questionNum = 1;
    return <>
        {contents.map(content => {
            let questionHeading = null;
            if (isQuestion(content)) {
                questionHeading = <h4>Question {questionNum++}</h4>;
            }
            return <React.Fragment key={content.id}>
                {questionHeading}
                <ContentViewer content={content}/>
            </React.Fragment>;
        })}
    </>;
}

type Section = { header: SectionHeader; content: Content [] };

function makeSectionMap(contents: Content[]) {
    const sections: Section[] = [];
    const initialSection: Section = {header: {type: "SectionHeader", id: "missingSectionHeader", title: "Missing Header", description: "These questions are not in a section; add a Section at the beginning of the survey."}, content: []};
    let currentSection = initialSection;
    let questionNum = 1;
    contents.forEach(c => {
        if (isSectionHeader(c)) {
            currentSection = {header: c, content: []};
            sections.push(currentSection);
        } else {
            if (isQuestion(c)) {
                c.questionNumber = questionNum++;
            }
            currentSection.content.push(c);
        }
    });
    if (initialSection.content.length > 0) {
        sections.unshift(initialSection);
    }
    return sections;
}

function PreviewMobile({contents}: {contents: Content[]}) {
    const sections = useMemo(() => makeSectionMap(contents), [contents]);
    const [currentSection, setCurrentSection] = useState(0);

    useEffect(() => {
        if (currentSection >= contents.length) {
            setCurrentSection(contents.length - 1);
        }
    }, [contents.length, currentSection]);

    const section = sections[currentSection];

    return <>
        <div style={{display: 'flex'}}>
            <IconButton disabled={currentSection === 0} onClick={() => setCurrentSection(num => num - 1)}><ChevronLeftIcon /></IconButton>
            <Spacer />
            <IconButton disabled={currentSection === sections.length - 1} onClick={() => setCurrentSection(num => num + 1)}><ChevronRightIcon /></IconButton>
        </div>
        <ContentViewer content={section.header} />
        {section.content.map(content => {
            let questionHeading = null;
            if (isQuestion(content)) {
                questionHeading = <h4>Question {content.questionNumber}</h4>;
            }
            return <React.Fragment key={content.id}>
                {questionHeading}
                <ContentViewer content={content}/>
            </React.Fragment>;
        })}
    </>;
}

function PreviewDialog({isOpen, close, contents}: (InjectedDialogProps & {contents: Content[]})) {
    const classes = useStyles();

    const [mode, setMode] = useState<PreviewTypeMenuProps["type"]>("mobile");

    return (
            <Dialog
                open={isOpen}
                onClose={close}
                scroll="paper"
                maxWidth={mode === "tablet" ? false : "xs"}
                fullWidth
            >
                <DialogTitle disableTypography className={classes.previewTitle}>
                    <Typography variant="h6">Preview</Typography>
                    <Spacer/>
                    <PreviewTypeMenu type={mode} setType={(mode) => setMode(mode)}/>
                </DialogTitle>
                <DialogContent dividers>
                    {mode === "tablet" ?
                        <PreviewTablet contents={contents}/>
                        :
                        <PreviewMobile contents={contents}/>
                    }
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


function getCountUnder(content: Content[], index: number) {
    const item = content[index];
    if (item.type === 'SectionHeader') {
        // Count questions under this
        let i;
        for (i = index + 1; i < content.length; i++) {
            if (content[i].type === 'SectionHeader') {
                break;
            }
        }
        return i - index;
    }
    return 1;
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
                        <EditorContext.Provider value={{state: editorState, dispatch: editorDispatch, hasSingleSection}}>
                            {content.map((c, index) => <Draggable key={c.id} draggableId={c.id} index={index} isDragDisabled={hasSingleSection && c.type === 'SectionHeader'}>
                                {(provided) =>
                                    <ContentEditor content={c} ref={provided.innerRef} draggableProps={provided.draggableProps} dragHandleProps={provided.dragHandleProps} modify={(newC) => {
                                        const newContent = [...content];
                                        let on;
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
                                                              {...provided.dragHandleProps}
                                                              onClick={() => {
                                                                  const id = ulid();
                                                                  const newItem = {type: item.type, id};
                                                                  const newContent = [...content, newItem];
                                                                  actions.set(newContent);
                                                                  editorDispatch({type: "focus", on: id});
                                                              }}
                                                    >
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
    </ThemeProvider>);
}
