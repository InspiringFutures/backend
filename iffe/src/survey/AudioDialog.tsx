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
import { useReactMediaRecorder } from "react-media-recorder";

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import StopIcon from "@material-ui/icons/Stop";

import { Spacer } from "./Spacer";
import { TextWithOptionalAudio } from "./SurveyContent";
import { extractText } from "./EditableText";


type SaveFunc = (value?: TextWithOptionalAudio) => void;

export interface AudioDialogRef {
    open: (current: TextWithOptionalAudio, onSave: SaveFunc) => void;
}

function withoutAudio(current?: TextWithOptionalAudio) {
    if (current === undefined) {
        return undefined;
    }
    if (typeof current === 'string') {
        return current;
    }
    return {
        text: current.text,
    };
}

function withAudio(current: TextWithOptionalAudio, currentRecording: any) {
    return {
        text: extractText(current),
        audio: currentRecording,
    };
}

function extractAudio(current: TextWithOptionalAudio) {
    return typeof current === 'string' ? undefined : current.audio;
}

const convertToBase64 = (blob: Blob): Promise<string | undefined> => {
    return new Promise((resolve, reject)=> {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result?.toString());
        reader.onerror = error => reject(error);
    });
}

export const AudioDialog = forwardRef<AudioDialogRef>((props, ref) => {
    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), [setOpen]);

    const [current, setCurrent] = useState<TextWithOptionalAudio>();
    const [onSave, setOnSave] = useState<SaveFunc>();

    const [currentRecording, setCurrentRecording] = useState<string>();

    const {
        status,
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({
        audio: true,
        video: false,
        blobPropertyBag: {type: 'audio/mp4'},
        onStop,
    });

    useImperativeHandle(ref, () => ({
        open: (current, onSave) => {
            setOpen(true);
            setCurrent(current);
            setOnSave(onSave);
            setCurrentRecording(extractAudio(current));
        },
    }), [setOpen]);

    function deleteAudio() {
        onSave?.(withoutAudio(current));
        close();
    }

    function saveAudio() {
        current && onSave?.(withAudio(current, currentRecording));
        close();
    }

    async function onStop(blobUrl: string, blob: Blob) {
        const audio = await convertToBase64(blob);
        const header = (await blob.text()).substring(0, 200);
        console.log("Recording", blobUrl, blob, header);
        setCurrentRecording(audio);
    }

    return (
        <Dialog
            open={open}
            onClose={close}
            scroll="body"
            fullWidth
        >
            <DialogTitle disableTypography className={classes.previewTitle}>
                <p>{extractText(current)}</p>
            </DialogTitle>
            <DialogContent dividers>
                {status === "recording" && <div>
                    Recording...
                    <Button startIcon={<StopIcon />} onClick={stopRecording}>
                        Stop
                    </Button>
                </div>}
                {status !== "recording" && <div>
                    <Button startIcon={<FiberManualRecordIcon />} onClick={startRecording}>
                        Record
                    </Button>
                    <br />
                    {mediaBlobUrl && <audio src={mediaBlobUrl} controls />}
                </div>}
            </DialogContent>
            <DialogActions>
                {current && extractAudio(current) && <Button onClick={deleteAudio} color="secondary">
                    Delete
                </Button>}
                <Button onClick={close}>
                    Close
                </Button>
                {currentRecording && <Button onClick={saveAudio} color="primary">
                    Save
                </Button>}
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
