import React, { FunctionComponent, useState } from 'react';
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
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import SaveIcon from '@material-ui/icons/Save';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ShortTextIcon from '@material-ui/icons/ShortText';

import { RouteComponentProps } from "@reach/router";
import { Button, IconButton, Paper, TextareaAutosize } from "@material-ui/core";
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
        },
        drawerPaper: {
            width: drawerWidth,
        },
        drawerContainer: {
            overflow: 'auto',
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(3),
        },
        contentItem: {
            padding: theme.spacing(1),
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
        },
        editableMultiline: {
            flexGrow: 1,
            display: 'flex',
            alignItems: 'start',
        },
        editableMultilineContents: {
            flexGrow: 1,
        },
        placeholder: {
            color: '#777',
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


export const escapedNewLineToLineBreakTag = (string) => string.split('\n').map((item, index) => (index === 0) ? item : [<br key={index} />, item])

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
                alert("Cannot be empty.");
                return;
            }
        } else {
            onSave(current);
        }
        setEditing(false);
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (!multiLine && e.key === "Enter") {
            save();
        } else if (e.key === "Escape") {
            cancel();
        }
    }

    return isEditing ?
        <>
            {multiLine ?
                <TextareaAutosize rowsMax={10} autoFocus className={classes.editableInput} value={current}
                      onChange={e => setCurrent(e.target.value)} onKeyUp={handleKey}
                      placeholder={placeHolder}/>
                :
                <input autoFocus className={classes.editableInput} value={current}
                       onChange={e => setCurrent(e.target.value)} onKeyUp={handleKey}
                       placeholder={placeHolder} />
            }
            <IconButton onClick={cancel}><CancelIcon /></IconButton>
            <IconButton onClick={save}><CheckCircleIcon /></IconButton>
        </>
    : multiLine ?
            <div className={classes.editableMultiline}><div className={classes.editableMultilineContents} onDoubleClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : escapedNewLineToLineBreakTag(text)}</div><IconButton onClick={startEdit}><EditIcon /></IconButton></div>
    :
            <span className={classes.editableHolder} onDoubleClick={startEdit}>{text === undefined ? <i className={classes.placeholder}>{placeHolder}</i> : text}<IconButton onClick={startEdit}><EditIcon /></IconButton></span>;
}

type Editor<C extends Content> = FunctionComponent<{
    content: C;
    modify: (newContent: C) => void
}>;

const SectionHeaderEditor: Editor<SectionHeader> = ({content, modify}) => {
    const classes = useStyles();

    return <Paper className={classes.contentItem}>
        <Typography variant="h4" className={classes.editableWrapper}>Section: <EditableText text={content.title} onSave={text => modify({...content, title: text!})} /></Typography>
        <Typography className={classes.editableWrapper}><div>Description:</div><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description of this section" text={content.description} onSave={text => modify({...content, description: text})} /></Typography>
    </Paper>;
};

const TextBlockEditor: Editor<TextBlock> = ({content, modify}) => {
    const classes = useStyles();

    return <Paper className={classes.contentItem}>
        <Typography className={classes.editableWrapper}><div>Text:</div><Spacer width={8} /><EditableText multiLine text={content.title} onSave={text => modify({...content, title: text!})} /></Typography>
    </Paper>;
};

const TextQuestionEditor: Editor<TextQuestion> = ({content, modify}) => {
    const classes = useStyles();

    return <Paper className={classes.contentItem}>
        <Typography className={classes.editableWrapper}><ShortTextIcon />Text Question: <EditableText text={content.title} onSave={text => modify({...content, title: text!})} /></Typography>
        {content.description !== undefined && <Typography className={classes.editableWrapper}><div>Description:</div><Spacer width={8} />
        <EditableText multiLine placeHolder="Additional description that appears under this question." text={content.description} onSave={text => modify({...content, description: text})} /></Typography>}
        <Typography className={classes.editableWrapper}>Placeholder: <EditableText placeHolder="This can be shown to clients if they haven't entered an answer." text={content.placeHolder} onSave={text => modify({...content, placeHolder: text})} /></Typography>
    </Paper>;
};

const Editors: {[name in Content["type"]]: Editor<any>} = {
    "SectionHeader": SectionHeaderEditor,
    "TextBlock": TextBlockEditor,
    "TextQuestion": TextQuestionEditor,
};

const ContentEditor: Editor<Content> = ({content, modify}) => {
    const Editor = Editors[content.type];
    return <Editor content={content as any} modify={modify}/>;
};

export default function SurveyEditor({surveyId}: SurveyEditorProps) {
    const classes = useStyles();

    // Load the survey!
    const [surveyInfo, setSurveyInfo] = useState<SurveyInfo>({name: "Survey " + surveyId});
    const [content, setContent] = useState<Content[]>([
        {type: "SectionHeader", id: "a", title: "Welcome to Inspiring Futures", description: "We have some questions."},
        {type: "TextBlock", id: "b", title: "Here is some text"},
        {type: "TextQuestion", id: "c", title: "What is your name?", description: "Please give a name we can use to talk to you.\nHere is some text\nAnother line\nAnd another"},
        {type: "SectionHeader", id: "a", title: "Welcome to Inspiring Futures"},
    ]);

    return (
        <div className={classes.root}>
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
            <main className={classes.content}>
                <Toolbar />
                {content.map((c, index) => <ContentEditor key={c.id} content={c} modify={(newC) => {
                    const newContent = content.slice();
                    newContent.splice(index, 1, newC);
                    setContent(newContent);
                }} />)}
            </main>
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
                    <List>
                        {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                            <ListItem button key={text}>
                                <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                                <ListItemText primary={text} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        {['All mail', 'Trash', 'Spam'].map((text, index) => (
                            <ListItem button key={text}>
                                <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                                <ListItemText primary={text} />
                            </ListItem>
                        ))}
                    </List>
                </div>
            </Drawer>
        </div>
    );
}
