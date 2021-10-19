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

function mergeBuffers(buffers: Float32Array[]) {
    const length = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const result = new Float32Array(length);
    let offset = 0;
    buffers.forEach((buffer) => {
        result.set(buffer, offset);
        offset += buffer.length;
    });
    return result
}

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
    const contents = useRef<Float32Array[]>([]);
    const sampleRate = useRef(0);
    const stream = useRef<MediaStream>();
    const audioInput = useRef<MediaStreamAudioSourceNode>();
    const recorder = useRef<ScriptProcessorNode>();

    async function startRecording() {
        setStatus(Status.Recording);
        stream.current = await getStream();

        const context = new AudioContext();
        sampleRate.current = context.sampleRate;

        audioInput.current = context.createMediaStreamSource(stream.current);
        const bufferSize = 2048;
        recorder.current = context.createScriptProcessor(bufferSize, 1, 1);

        audioInput.current.connect(recorder.current);

        recorder.current.connect(context.destination);

        contents.current = [];

        recorder.current.onaudioprocess = (e) => {
            if (!recording.current) {
                // Nothing left to do
                return;
            }
            const input = e.inputBuffer.getChannelData(0);
            contents.current.push(new Float32Array(input));
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

        const finalBuffer = mergeBuffers(contents.current);
        contents.current = [];

        const context = new AudioContext();
        const buffer = context.createBuffer(1, finalBuffer.length, sampleRate.current);
        buffer.copyToChannel(finalBuffer, 0);

        const data = [];
        const encoder = new Mp3Encoder(1, sampleRate.current, 64);
        const samples = new Int16Array(finalBuffer.length);

        for (var i = 0; i < finalBuffer.length; ++i) {
            var sample = finalBuffer[i];

            // clamp and convert to 16bit number
            sample = Math.min(1, Math.max(-1, sample));
            sample = Math.round(sample * MAX_AMPLITUDE);

            samples[i] = sample;
        }
        data.push(encoder.encodeBuffer(samples));
        data.push(encoder.flush());
        console.log(data);
        const blob = new Blob(data, {type: 'audio/mp3'});
        const audio = await encodeBase64(blob);
        const header = (await blob.text()).substring(0, 200);
        console.log("Recording", blob, header);
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
                {status === Status.Recording && <div className={classes.reviewRow}>
                    <CircularProgress size={24} />
                    <Spacer />
                    Recording...
                    <Spacer />
                    <Button startIcon={<StopIcon />} onClick={stopRecording}>
                        Stop
                    </Button>
                </div>}
                {status === Status.Stopped && (
                    currentRecording ?
                        <div className={classes.reviewRow}>
                            <audio src={currentRecording} controls />
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
