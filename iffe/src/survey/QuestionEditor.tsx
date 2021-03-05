import React, { FunctionComponent, PropsWithChildren } from "react";
import { Content, SurveyContent, SurveyQuestion } from "./SurveyContent";
import { EditableText } from "./EditableText";
import Typography from "@material-ui/core/Typography";
import { Spacer } from "./Spacer";
import { QuestionTypeMenu } from "./QuestionTypeMenu";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { sharedStyles } from "./styles";

export interface ModifyOptions {
    sectionOnly?: boolean;
}

export type ModifyFunction = (newContent: SurveyContent | undefined | "duplicate", modifyOptions?: ModifyOptions) => void;

export type EditorProps<C extends Content> = {
    content: C;
    modify: ModifyFunction;
};
export type Editor<C extends Content> = FunctionComponent<EditorProps<C>>;

interface QuestionEditorProps {
    questionTitle?: string;
}

export const QuestionEditor = function ({
                                            content,
                                            modify,
                                            children,
                                            questionTitle
                                        }: PropsWithChildren<EditorProps<SurveyQuestion>> & QuestionEditorProps) {
    const classes = useStyles();

    return <>
        <div className={classes.questionEditor}>
            <div className={classes.questionEditorTitleDesc}>
                <div className={classes.questionEditorTitle}>
                    <EditableText text={content.title} placeHolder={questionTitle ?? "Question"}
                                  onSave={text => modify({...content, title: text})}/>
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
                    let commentsPrompt = undefined;
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
                            commentsPrompt = content.commentsPrompt;
                            break;
                        case "YesNoQuestion":
                            choices = ["No", "Yes"];
                            break;
                        case "TextQuestion":
                        case "ParagraphQuestion":
                            placeholder = content.placeholder;
                    }
                    const newContent: SurveyQuestion = {
                        type,
                        title: content.title,
                        description: content.description,
                        id: content.id
                    };
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
                            newContent.commentsPrompt = commentsPrompt;
                            break;
                        case "TextQuestion":
                        case "ParagraphQuestion":
                            newContent.placeholder = placeholder;
                    }
                    modify(newContent);
                }}/>
            </div>
        </div>
        {children}
    </>;
};


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        ...sharedStyles,
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
    }),
);
