import {
    CheckboxGridQuestion,
    CheckboxQuestion,
    ChoiceGridQuestion,
    ChoiceQuestion,
    ConsentQuestion,
    Content,
    JournalQuestion,
    ParagraphQuestion,
    SectionHeader,
    TextBlock,
    TextQuestion, TextWithOptionalAudio,
    YesNoQuestion
} from "./SurveyContent";
import { Editor, EditorProps, QuestionEditor } from "./QuestionEditor";
import Typography from "@material-ui/core/Typography";
import { EditableText, extractText } from "./EditableText";
import React, { forwardRef, useContext, useEffect, useRef } from "react";
import { EditableTextArray } from "./EditableTextArray";
import {
    Checkbox,
    FormControlLabel,
    IconButton,
    Paper,
    Tooltip
} from "@material-ui/core";
import { Spacer } from "./Spacer";
import { EditorContext } from "./EditorContext";
import FilterNoneIcon from "@material-ui/icons/FilterNone";
import DeleteIcon from "@material-ui/icons/Delete";
import { Viewers } from "./Viewers";
import DragHandle from "@material-ui/icons/DragHandle";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { sharedStyles } from "./styles";
import { usePopupMenu } from "./PopupMenu";

function wrapText(text: string | undefined): {text: string} | undefined;
function wrapText(text: string): {text: string};
function wrapText(text: string | undefined) {
    return text ? {text} : undefined;
}

const SectionHeaderEditor: Editor<SectionHeader> = ({content, modify}) => {
    const classes = useStyles();
    const {hasSingleSection} = useContext(EditorContext);

    return <>
        <Typography variant="h4"
                    className={classes.editableWrapper}>{!hasSingleSection && "Section: "}<EditableText
            placeHolder="Title" text={wrapText(content.title)}
            noAudio
            onSave={text => modify({...content, title: extractText(text)})}/></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8}/>
            <EditableText multiLine placeHolder="Additional description of this section"
                          text={content.description}
                          onSave={text => modify({...content, description: text})}/></Typography>
    </>;
};

const TextBlockEditor: Editor<TextBlock> = ({content, modify}) => {
    const classes = useStyles();

    return <Typography className={classes.editableWrapper}><span>Text:</span><Spacer
        width={8}/><EditableText placeHolder="Explanatory text" multiLine text={content.title}
                                 onSave={text => modify({...content, title: text})}/></Typography>;
};

const TextQuestionEditor: Editor<TextQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography variant="body1" className={classes.editableWrapper}>Placeholder: <EditableText
            placeHolder="This can be shown to clients if they haven't entered an answer."
            text={wrapText(content.placeholder)}
            noAudio
            onSave={text => modify({...content, placeholder: extractText(text)})}/></Typography>
    </QuestionEditor>;
};

const YesNoQuestionEditor: Editor<YesNoQuestion> = (props) => {
    return <QuestionEditor {...props} />
};

const ConsentQuestionEditor: Editor<ConsentQuestion> = (props) => {
    return <QuestionEditor {...props} questionTitle="Consent statement"/>
};

const ParagraphQuestionEditor: Editor<ParagraphQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography variant="body1" className={classes.editableWrapper}>Placeholder: <EditableText
            placeHolder="This can be shown to clients if they haven't entered an answer."
            noAudio
            text={wrapText(content.placeholder)}
            onSave={text => modify({...content, placeholder: extractText(text)})}/></Typography>
    </QuestionEditor>;
};

const ChoiceQuestionEditor: Editor<ChoiceQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Choices" placeholder="Add choice"
                                   entries={content.choices || []}
                                   onSave={(choices) => modify({...content, choices})}/>
                <FormControlLabel
                    control={<Checkbox checked={!!content.allowOther} onChange={(e) => modify({
                        ...content,
                        allowOther: e.target.checked
                    })}/>}
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
                <EditableTextArray heading="Options" placeholder="Add option"
                                   entries={content.choices || []}
                                   onSave={(choices) => modify({...content, choices})}/>
                <FormControlLabel
                    control={<Checkbox checked={!!content.allowOther} onChange={(e) => modify({
                        ...content,
                        allowOther: e.target.checked
                    })}/>}
                    label={"Allow user to type an \"Other\" option"}
                />
            </div>
        </div>
    </QuestionEditor>;
};

interface GridEditorProps {
    content: ChoiceGridQuestion | CheckboxGridQuestion,
    onSaveRows: (rows: TextWithOptionalAudio[]) => void,
    onSaveColumns: (columns: TextWithOptionalAudio[]) => void,
    onSaveCommentsPrompt: (value?: TextWithOptionalAudio) => void
}

function GridEditor({content, onSaveRows, onSaveColumns, onSaveCommentsPrompt}: GridEditorProps) {
    const classes = useStyles();

    return <>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Rows" placeholder="Add row"
                                   entries={content.rows || []}
                                   onSave={onSaveRows}/>
            </div>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Columns" placeholder="Add column"
                                   entries={content.columns?.map(wrapText) || []}
                                   noAudio
                                   onSave={onSaveColumns}/>
            </div>
        </div>
        <Typography variant="body1" className={classes.editableWrapper}>
            <EditableText withCheckbox label="Prompt user for additional comments"
                          text={content.commentsPrompt} onSave={onSaveCommentsPrompt}/>
        </Typography>
    </>;
}

export function extractColumns(columns: TextWithOptionalAudio[]) {
    return columns.map((text) => extractText(text));
}

const ChoiceGridQuestionEditor: Editor<ChoiceGridQuestion> = (props) => {
    const {content, modify} = props;
    return <QuestionEditor {...props}>
        <GridEditor content={content}
                    onSaveRows={(rows) => modify({...content, rows})}
                    onSaveColumns={(columns) => modify({...content, columns: extractColumns(columns)})}
                    onSaveCommentsPrompt={(commentsPrompt) => {
                        modify({...content, commentsPrompt});
                    }}/>
    </QuestionEditor>;
};

const CheckboxGridQuestionEditor: Editor<CheckboxGridQuestion> = (props) => {
    const {content, modify} = props;

    return <GridEditor content={content}
                onSaveRows={(rows) => modify({...content, rows})}
                onSaveColumns={(columns) => modify({...content, columns: extractColumns(columns)})}
                onSaveCommentsPrompt={(commentsPrompt) => {
                    modify({...content, commentsPrompt});
                }}/>
};


const JournalQuestionEditor: Editor<JournalQuestion> = (props) => {
    return <QuestionEditor {...props}>
        <div>
            <i>Clients can enter journal entries here</i>
        </div>
    </QuestionEditor>;
};

const Editors: { [name in Content["type"]]: Editor<any> } = {
    "SectionHeader": SectionHeaderEditor, // Uses EditorContext so can't memoise
    "TextBlock": React.memo(TextBlockEditor),
    "TextQuestion": React.memo(TextQuestionEditor),
    "YesNoQuestion": React.memo(YesNoQuestionEditor),
    "ConsentQuestion": React.memo(ConsentQuestionEditor),
    "ParagraphQuestion": React.memo(ParagraphQuestionEditor),
    "ChoiceQuestion": React.memo(ChoiceQuestionEditor),
    "CheckboxQuestion": React.memo(CheckboxQuestionEditor),
    "ChoiceGridQuestion": React.memo(ChoiceGridQuestionEditor),
    "CheckboxGridQuestion": React.memo(CheckboxGridQuestionEditor),
    "JournalQuestion": React.memo(JournalQuestionEditor),
};

const EditorFooter: Editor<Content> = ({content, modify}) => {
    const classes = useStyles();
    const {hasSingleSection} = useContext(EditorContext);

    const duplicateMenu = usePopupMenu({
        "Duplicate section and contents": () => modify("duplicate"),
        "Duplicate just the section header": () => modify("duplicate", {sectionOnly: true}),
    });

    const deleteMenu = usePopupMenu({
        "Delete section and contents": () => modify(undefined),
        "Delete just the section header": () => modify(undefined, {sectionOnly: true}),
    });

    return <div className={classes.editorFooterWrapper}>
        <Spacer/>
        {duplicateMenu.provided}
        <Tooltip title="Duplicate">
            <IconButton className={classes.editableInlineButton}
                        onClick={content.type === 'SectionHeader' ? duplicateMenu.open : () => modify("duplicate")}>
                <FilterNoneIcon/>
            </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
            {content.type === 'SectionHeader' ?
                hasSingleSection ? <></> : <>
                    {deleteMenu.provided}
                    <IconButton className={classes.editableInlineButton} onClick={deleteMenu.open}><DeleteIcon/></IconButton>
                </>
                :
                    <IconButton className={classes.editableInlineButton} onClick={() => modify(undefined)}><DeleteIcon/></IconButton>
            }
        </Tooltip>
    </div>;
};

type ContentEditorProps = EditorProps<Content> & { draggableProps: any; dragHandleProps: any };
export const ContentEditor = forwardRef<HTMLDivElement, ContentEditorProps>(({
                                                                                 content,
                                                                                 modify,
                                                                                 draggableProps,
                                                                                 dragHandleProps
                                                                             }, ref) => {
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
    return <Paper
        className={`${classes.contentItem} ${editorState.activeQuestion === content.id ? classes.contentItemActive : ''} ${content.type === 'SectionHeader' ? classes.contentItemSection : classes.contentItemChild}`}
        ref={wrapRef} {...draggableProps}
        onClick={() => {
            if (editorState.activeQuestion !== content.id) {
                dispatch({type: 'focus', on: content.id});
            }
        }}>
        {dragHandleProps !== null &&
        <div className={classes.dragHandle} {...dragHandleProps}><DragHandle/></div>}
        <div className={classes.editorContents}>
            {editorState.activeQuestion === content.id ?
                <>
                    <Editor content={content as any} modify={modify}/>
                    <EditorFooter content={content} modify={modify}/>
                </>
                : <div className={classes.editorClosedWrapper}>
                    <Viewer content={content as any}/>
                </div>
            }
        </div>
    </Paper>;
});


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        ...sharedStyles,
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
        dragHandle: {
            background: '#fcfcfc',
            textAlign: 'center',
            color: '#ddd',
            '&:hover': {
                color: '#777',
            },
        },
        choiceGridColumns: {
            display: 'flex',
        },
        choiceGridColumn: {
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
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
    }),
);
