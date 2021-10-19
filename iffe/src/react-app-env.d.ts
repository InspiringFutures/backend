/// <reference types="react-scripts" />

declare module 'audio-react-recorder' {
    enum RecordState {
        START = 'start',
        PAUSE = 'pause',
        STOP = 'stop',
        NONE = 'none',
    }
    interface AudioReactRecorderProps {
        state: RecordState;
        onStop: (data) => void;
    }

    class AudioReactRecorder extends React.Component<AudioReactRecorderProps, any> {} {

    }

    export default AudioReactRecorder
}

declare module 'audio-encoder' {
    function audioEncoder(buffer: AudioBuffer, sampleRate: number, onProgress: null, onDone: (blob: Blob) => void);
    export default audioEncoder;
}
