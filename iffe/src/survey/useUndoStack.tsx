import { useMemo, useReducer } from "react";

type UndoAction<T> =
    | { type: 'set'; value: T }
    | { type: 'undo' }
    | { type: 'redo' }
    ;
type UndoState<T> = {
    past: T[];
    present: T;
    future: T[];
}
type UndoReducer<T> = (state: UndoState<T>, action: UndoAction<T>) => UndoState<T>;
// Not a strict reducer, but we know what state is exposed and that this is safe.
const undoReducer = function <T extends any>(state: UndoState<T>, action: UndoAction<T>): UndoState<T> {
    switch (action.type) {
        case 'set':
            if (action.value === state.present) {
                return state;
            }
            state.past.push(state.present);
            return {...state, present: action.value, future: []};
        case 'undo':
            if (state.past.length === 0) {
                return state;
            }
            const last = state.past.pop()!;
            state.future.push(state.present);
            return {...state, present: last};
        case 'redo':
            if (state.future.length === 0) {
                return state;
            }
            const next = state.future.pop()!;
            state.past.push(state.present);
            return {...state, present: next};
    }
    return state;
};

interface UndoActions<T> {
    set: (value: T) => void;
    undo: () => void;
    redo: () => void;
}

interface UndoStack<T> {
    content: T;
    canUndo: boolean;
    canRedo: boolean;
    actions: UndoActions<T>;
}

export const useUndoStack = function <T extends any>(initialState: T): UndoStack<T> {
    const initializerArg: UndoState<T> = {
        past: [],
        present: initialState,
        future: []
    };
    const [state, dispatch] = useReducer<UndoReducer<T>>(undoReducer, initializerArg);
    const actions = useMemo(() => {
        return {
            set: (value: T) => dispatch({type: 'set', value}),
            undo: () => dispatch({type: 'undo'}),
            redo: () => dispatch({type: 'redo'}),
        };
    }, []);
    return {
        content: state.present,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        actions,
    };
};
