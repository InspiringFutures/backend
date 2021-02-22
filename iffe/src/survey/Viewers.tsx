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
import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from "react";
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    TextField
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { escapedNewLineToLineBreakTag } from "./EditableText";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

type ViewerProps<C extends Content> = {
    content: C;
};
type Viewer<C extends Content> = FunctionComponent<ViewerProps<C>>;

const Description: Viewer<Content> = ({content}) => {
    const classes = useStyles();
    return content.description ?
        <Typography
            className={classes.description}>{escapedNewLineToLineBreakTag(content.description)}</Typography>
        : null;
};

const SectionHeaderViewer: Viewer<SectionHeader> = ({content}) => {
    return <>
        <Typography variant="h4">{content.title ? content.title :
            <em>Untitled Section</em>}</Typography>
        <Description content={content}/>
    </>;
};

const TextBlockViewer: Viewer<TextBlock> = ({content}) => {
    return content.title ? <Typography>{escapedNewLineToLineBreakTag(content.title)}</Typography> :
        <em>Empty text block</em>;
};

const TextQuestionViewer: Viewer<TextQuestion> = ({content}) => {
    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth/>
        <Description content={content}/>
    </>;
};

const YesNoQuestionViewer: Viewer<YesNoQuestion> = ({content}) => {
    return <>
        <FormLabel>{content.title}</FormLabel>
        <RadioGroup>
            <FormControlLabel value="yes" control={<Radio/>} label="Yes"/>
            <FormControlLabel value="no" control={<Radio/>} label="No"/>
        </RadioGroup>
        <Description content={content}/>
    </>;
};

const ConsentQuestionViewer: Viewer<ConsentQuestion> = ({content}) => {
    return <>
        <Typography variant="body1">Please tick to show you agree to the following:</Typography>
        <FormControlLabel label={content.title} control={<Checkbox/>}/>
        <Description content={content}/>
    </>;
};

const ParagraphQuestionViewer: Viewer<ParagraphQuestion> = ({content}) => {
    return <>
        <TextField label={content.title} placeholder={content.placeholder} fullWidth multiline
                   rows={4} rowsMax={10}/>
        <Description content={content}/>
    </>;
};

const ChoiceQuestionViewer: Viewer<ChoiceQuestion> = ({content}) => {
    const choices = content.choices || [];
    const [value, setValue] = useState("");

    let selectOther = () => setValue("other");
    return <FormControl>
        <FormLabel>{content.title}</FormLabel>
        <Description content={content}/>
        {choices.length > 0 ?
            <RadioGroup value={value} onChange={(e) => setValue(e.currentTarget.value)}>
                {choices.map((choice, index) => <FormControlLabel key={index} value={"c" + index}
                                                                  control={<Radio/>}
                                                                  label={choice}/>)}
                {content.allowOther && <FormControlLabel value="other" control={<Radio/>}
                                                         label={<span>Other: <TextField
                                                             onClick={selectOther}
                                                             onChange={selectOther}/></span>}/>}
            </RadioGroup>
            : <em>No choices defined</em>
        }
    </FormControl>;
};

const CheckboxQuestionViewer: Viewer<CheckboxQuestion> = ({content}) => {
    const choices = content.choices || [];
    const [otherChecked, setOtherChecked] = useState(false);

    const otherRef = useRef<HTMLInputElement>(null);

    return <FormControl>
        <FormLabel>{content.title}</FormLabel>
        <Description content={content}/>
        {choices.length > 0 ?
            <>
                {choices.map((choice, index) => <FormControlLabel key={index} value={"c" + index}
                                                                  control={<Checkbox/>}
                                                                  label={choice}/>)}
                {content.allowOther &&
                <FormControlLabel value="other" checked={otherChecked} onChange={(e, checked) => {
                    setOtherChecked(checked);
                    if (checked && otherRef.current) otherRef.current.focus();
                }} control={<Checkbox/>} label={<span>Other: <TextField onChange={(e) => {
                    if (e.target.value !== "") {
                        setOtherChecked(true);
                    }
                }} inputRef={otherRef}/></span>}/>}
            </>
            : <em>No options defined</em>
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
        <Description content={content}/>
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
                    {columns.map((column, colIndex) => <td key={colIndex}><Radio
                        checked={isChecked(index, colIndex)}
                        onChange={(checked) => setChecked(index, colIndex)}/></td>)}
                </tr>)}
                </tbody>
            </table>
            : <em>No rows/columns defined</em>}
        {content.commentsPrompt &&
        <TextField label={content.commentsPrompt} fullWidth multiline rows={4} rowsMax={10}/>
        }
    </>;
};

const CheckboxGridQuestionViewer: Viewer<CheckboxGridQuestion> = ({content}) => {
    const rows = content.rows || [];
    const columns = content.columns || [];

    return <>
        <FormLabel>{content.title}</FormLabel>
        <Description content={content}/>
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
                    {columns.map((column, colIndex) => <td key={colIndex}><Checkbox/></td>)}
                </tr>)}
                </tbody>
            </table>
            : <em>No rows/columns defined</em>}
        {content.commentsPrompt &&
        <TextField label={content.commentsPrompt} fullWidth multiline rows={4} rowsMax={10}/>
        }
    </>;
};

export const Viewers: { [name in Content["type"]]: Viewer<any> } = {
    "SectionHeader": SectionHeaderViewer,
    "TextBlock": TextBlockViewer,
    "TextQuestion": TextQuestionViewer,
    "YesNoQuestion": YesNoQuestionViewer,
    "ConsentQuestion": ConsentQuestionViewer,
    "ParagraphQuestion": ParagraphQuestionViewer,
    "ChoiceQuestion": ChoiceQuestionViewer,
    "CheckboxQuestion": CheckboxQuestionViewer,
    "ChoiceGridQuestion": ChoiceGridQuestionViewer,
    "CheckboxGridQuestion": CheckboxGridQuestionViewer,
};

export const ContentViewer = ({content}: ViewerProps<Content>) => {
    const Viewer = Viewers[content.type];
    return <Viewer content={content as any}/>;
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        description: {
            color: '#37474f',
        },
    }),
);
