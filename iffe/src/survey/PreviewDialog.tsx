import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Typography from "@material-ui/core/Typography";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import { Content, isQuestion, isSectionHeader, SectionHeader } from "./SurveyContent";

import { PreviewTypeInfo, PreviewTypeMenu } from "./PreviewTypeMenu";
import { InjectedDialogProps } from "./MakeDialog";
import { Spacer } from "./Spacer";
import { ContentViewer } from "./Viewers";

function PreviewTablet({contents}: { contents: Content[] }) {
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

export type Section = { header: SectionHeader; content: Content [] };

function makeSectionMap(contents: Content[]) {
    const sections: Section[] = [];
    const initialSection: Section = {
        header: {
            type: "SectionHeader",
            id: "missingSectionHeader",
            title: "Missing Header",
            description: "These questions are not in a section; add a Section at the beginning of the survey."
        }, content: []
    };
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

function PreviewMobile({contents}: { contents: Content[] }) {
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
            <IconButton disabled={currentSection === 0}
                        onClick={() => setCurrentSection(num => num - 1)}><ChevronLeftIcon/></IconButton>
            <Spacer/>
            <IconButton disabled={currentSection === sections.length - 1}
                        onClick={() => setCurrentSection(num => num + 1)}><ChevronRightIcon/></IconButton>
        </div>
        <ContentViewer content={section.header}/>
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

export function PreviewDialog({
                                  isOpen,
                                  close,
                                  contents
                              }: (InjectedDialogProps & { contents: Content[] })) {
    const classes = useStyles();

    const [mode, setMode] = useState<keyof typeof PreviewTypeInfo>("mobile");

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

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        previewTitle: {
            display: 'flex',
            flexDirection: 'row',
        },
    }),
);
