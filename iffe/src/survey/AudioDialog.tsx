import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Mp3Encoder } from 'lamejs';

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import StopIcon from "@material-ui/icons/Stop";

import { TextWithOptionalAudio } from "./SurveyContent";
import { extractAudio, extractText } from "./EditableText";
import { useWrappedRef } from "./utils";
import { Spacer } from "./Spacer";
import { endpoint } from "./api";


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

const encodeBase64 = (blob: Blob): Promise<string | undefined> => {
    return new Promise((resolve, reject)=> {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result?.toString());
        reader.onerror = error => reject(error);
    });
}


enum Status {
    Stopped = 'Stopped',
    Recording = 'Recording',
    Processing = 'Processing',
}

function getStream(constraints?: MediaStreamConstraints) {
    if (!constraints) {
        constraints = { audio: true, video: false }
    }

    return navigator.mediaDevices.getUserMedia(constraints);
}

const MAX_AMPLITUDE = 0x7FFF;

export const AudioDialog = forwardRef<AudioDialogRef>((props, ref) => {
    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), [setOpen]);

    const [current, setCurrent] = useState<TextWithOptionalAudio>();
    const onSave = useRef<SaveFunc>();

    const [currentRecording, setCurrentRecording] = useState<string>();

    useImperativeHandle(ref, () => ({
        open: (current, onSaveUnsafe) => {
            setOpen(true);
            setCurrent(current);
            onSave.current = onSaveUnsafe;
            const audio = extractAudio(current);
            setCurrentRecording(audio);
        },
    }), [setOpen]);

    const [status, setStatus] = useState<Status>(Status.Stopped);

    function deleteAudio() {
        onSave.current?.(withoutAudio(current));
        close();
    }

    function saveAudio() {
        current && onSave.current?.(withAudio(current, currentRecording));
        close();
    }

    const recording = useWrappedRef(status === Status.Recording);
    const stream = useRef<MediaStream>();
    const audioInput = useRef<MediaStreamAudioSourceNode>();
    const recorder = useRef<ScriptProcessorNode>();
    const encoder = useRef<Mp3Encoder>();
    const output = useRef<Int8Array[]>();

    async function startRecording() {
        setStatus(Status.Recording);
        stream.current = await getStream();

        const context = new AudioContext({sampleRate: 16000});

        audioInput.current = context.createMediaStreamSource(stream.current);
        recorder.current = context.createScriptProcessor(0, 1, 1);

        audioInput.current.connect(recorder.current);

        recorder.current.connect(context.destination);

        encoder.current = new Mp3Encoder(1, context.sampleRate, 64);
        output.current = [];

        recorder.current.onaudioprocess = (e) => {
            if (!recording.current) {
                // Nothing left to do
                return;
            }
            const input = e.inputBuffer.getChannelData(0);

            const samples = new Int16Array(input.length);

            for (let i = 0; i < input.length; ++i) {
                let sample = input[i];

                // clamp and convert to 16bit number
                sample = Math.min(1, Math.max(-1, sample));
                sample = Math.round(sample * MAX_AMPLITUDE);

                samples[i] = sample;
            }
            output.current?.push(encoder.current?.encodeBuffer(samples));
        }
    }

    async function stopRecording() {
        setStatus(Status.Processing);
        recording.current = false;

        stream.current?.getAudioTracks().forEach((track) => {
            track.stop()
        })
        audioInput.current?.disconnect(0);
        recorder.current?.disconnect(0);

        output.current?.push(encoder.current?.flush());

        const blob = new Blob(output.current, {type: 'audio/mp3'});
        const audio = await encodeBase64(blob);

        setCurrentRecording(audio);
        setStatus(Status.Stopped);
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
                {status === Status.Recording && (
                    currentRecording ?
                        <div className={classes.reviewRow}>
                            <CircularProgress size={24} />
                            <Spacer />
                            Recording...
                            <Spacer />
                            <Button startIcon={<StopIcon />} onClick={stopRecording}>
                                Stop
                            </Button>
                        </div>
                    :
                        <div>
                            <Button startIcon={<StopIcon />} onClick={stopRecording} size="large" style={{width: '100%'}}>
                                Recording...
                            </Button>
                        </div>
                    )
                }
                {status === Status.Stopped && (
                    currentRecording ?
                        <div className={classes.reviewRow}>
                            <audio src={currentRecording.replace('voice-over://', endpoint + '/api/voiceOver/')} controls />
                            <Spacer />
                            <Button startIcon={<FiberManualRecordIcon />} onClick={startRecording}>
                                Re-record
                            </Button>
                        </div>
                    :
                        <div>
                            <Button startIcon={<FiberManualRecordIcon />} onClick={startRecording} variant="contained" size="large" style={{width: '100%', backgroundColor: '#c22', color: 'white'}}>
                                Record
                            </Button>
                        </div>
                    )
                }
                {status === Status.Processing && <div className={classes.reviewRow}>
                    <Spacer />
                    <CircularProgress size={24} />
                    <Spacer />
                </div>}
            </DialogContent>
            <DialogActions>
                {current && extractAudio(current) && <Button onClick={deleteAudio} color="secondary">
                    Delete
                </Button>}
                <Button onClick={close}>
                    {(current && extractAudio(current)) === currentRecording ? "Close" : "Cancel"}
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
        reviewRow: {
            display: 'flex',
            alignItems: 'center',
        },
    }),
);
