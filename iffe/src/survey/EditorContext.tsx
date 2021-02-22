import React from "react";

export interface EditorState {
    activeQuestion?: string;
}

export type EditorAction =
    | { type: 'focus'; on: string };

interface EditorControl {
    state: EditorState;
    dispatch: (action: EditorAction) => void;
    hasSingleSection: boolean;
}

export const EditorContext = React.createContext<EditorControl>({
    state: {},
    dispatch: () => {
        throw new Error("EditorContext used outside of provider");
    },
    hasSingleSection: true,
});
