import {
    CheckboxGridQuestion,
    CheckboxQuestion,
    ChoiceGridQuestion,
    ChoiceQuestion,
    ConsentQuestion,
    Content,
    ParagraphQuestion,
    SectionHeader,
    TextBlock,
    TextQuestion,
    YesNoQuestion
} from "./SurveyContent";
import { Editor, EditorProps, QuestionEditor } from "./QuestionEditor";
import Typography from "@material-ui/core/Typography";
import { EditableText } from "./EditableText";
import React, { forwardRef, useContext, useEffect, useRef } from "react";
import { EditableTextArray } from "./EditableTextArray";
import { Checkbox, FormControlLabel, IconButton, Paper, Tooltip } from "@material-ui/core";
import { Spacer } from "./Spacer";
import { EditorContext } from "./EditorContext";
import FilterNoneIcon from "@material-ui/icons/FilterNone";
import DeleteIcon from "@material-ui/icons/Delete";
import { Viewers } from "./Viewers";
import DragHandle from "@material-ui/icons/DragHandle";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { sharedStyles } from "./styles";

const SectionHeaderEditor: Editor<SectionHeader> = ({content, modify}) => {
    const classes = useStyles();
    const {hasSingleSection} = useContext(EditorContext);

    return <>
        <Typography variant="h4"
                    className={classes.editableWrapper}>{!hasSingleSection && "Section: "}<EditableText
            placeHolder="Title" text={content.title}
            onSave={text => modify({...content, title: text})}/></Typography>
        <Typography className={classes.editableWrapper}><span>Description:</span><Spacer width={8}/>
            <EditableText multiLine placeHolder="Additional description of this section"
                          text={content.description}
                          onSave={text => modify({...content, description: text})}/></Typography>
    </>;
};

const TextBlockEditor: Editor<TextBlock> = ({content, modify}) => {
    const classes = useStyles();

    return <Typography className={classes.editableWrapper}><span>Text:</span><Spacer
        width={8}/><EditableText placeHolder="Explantory text" multiLine text={content.title}
                                 onSave={text => modify({...content, title: text})}/></Typography>;
};

const TextQuestionEditor: Editor<TextQuestion> = (props) => {
    const classes = useStyles();
    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <Typography variant="body1" className={classes.editableWrapper}>Placeholder: <EditableText
            placeHolder="This can be shown to clients if they haven't entered an answer."
            text={content.placeholder}
            onSave={text => modify({...content, placeholder: text})}/></Typography>
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
            text={content.placeholder}
            onSave={text => modify({...content, placeholder: text})}/></Typography>
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

const ChoiceGridQuestionEditor: Editor<ChoiceGridQuestion> = (props) => {
    const classes = useStyles();

    const {content, modify} = props;
    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Rows" placeholder="Add row" entries={content.rows || []}
                                   onSave={(rows) => modify({...content, rows})}/>
            </div>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Columns" placeholder="Add column"
                                   entries={content.columns || []}
                                   onSave={(columns) => modify({...content, columns})}/>
            </div>
        </div>
        <Typography variant="body1" className={classes.editableWrapper}>
            <EditableText withCheckbox label="Prompt user for additional comments"
                          text={content.commentsPrompt} onSave={(value) => {
                modify({...content, commentsPrompt: value});
            }}/>
        </Typography>
    </QuestionEditor>;
};

const CheckboxGridQuestionEditor: Editor<CheckboxGridQuestion> = (props) => {
    const classes = useStyles();

    const {content, modify} = props;

    return <QuestionEditor {...props}>
        <div className={classes.choiceGridColumns}>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Rows" placeholder="Add row" entries={content.rows || []}
                                   onSave={(rows) => modify({...content, rows})}/>
            </div>
            <div className={classes.choiceGridColumn}>
                <EditableTextArray heading="Columns" placeholder="Add column"
                                   entries={content.columns || []}
                                   onSave={(columns) => modify({...content, columns})}/>
            </div>
        </div>
        <Typography variant="body1" className={classes.editableWrapper}>
            <EditableText withCheckbox label="Prompt user for additional comments"
                          text={content.commentsPrompt} onSave={(value) => {
                modify({...content, commentsPrompt: value});
            }}/>
        </Typography>
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
};

const EditorFooter: Editor<Content> = ({content, modify}) => {
    const classes = useStyles();
    const {hasSingleSection} = useContext(EditorContext);

    return <div className={classes.editorFooterWrapper}>
        <Spacer/>
        <Tooltip title="Duplicate"><IconButton className={classes.editableInlineButton}
                                               onClick={() => modify("duplicate")}><FilterNoneIcon/></IconButton></Tooltip>
        {(content.type !== 'SectionHeader' || !hasSingleSection) &&
        <Tooltip title="Delete"><IconButton className={classes.editableInlineButton}
                                            onClick={() => modify(undefined)}><DeleteIcon/></IconButton></Tooltip>}
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
