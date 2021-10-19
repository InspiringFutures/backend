import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import { Spacer } from "./Spacer";
import { TextWithOptionalAudio } from "./SurveyContent";
import { extractText } from "./EditableText";


type SaveFunc = (value?: TextWithOptionalAudio) => void;

export interface AudioDialogRef {
    open: (current: TextWithOptionalAudio, onSave: SaveFunc) => void;
}

export const AudioDialog = forwardRef<AudioDialogRef>((props, ref) => {
    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), [setOpen]);

    const [current, setCurrent] = useState<TextWithOptionalAudio>();
    const [onSave, setOnSave] = useState<SaveFunc>();

    useImperativeHandle(ref, () => ({
        open: (current, onSave) => {
            setOpen(true);
            setCurrent(current);
            setOnSave(onSave);
        },
    }), [setOpen]);

    return (
        <Dialog
            open={open}
            onClose={close}
            scroll="paper"
            fullWidth
        >
            <DialogTitle disableTypography className={classes.previewTitle}>
                <Typography variant="h6">Audio recording</Typography>
                <Spacer/>
            </DialogTitle>
            <DialogContent dividers>
                Current text: {extractText(current)}
            </DialogContent>
            <DialogActions>
                <Button onClick={close} color="secondary">
                    Delete
                </Button>
                <Button onClick={close}>
                    Close
                </Button>
                <Button onClick={close} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
});

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        previewTitle: {
            display: 'flex',
            flexDirection: 'row',
        },
    }),
);
