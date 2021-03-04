import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Checkbox, IconButton, TextareaAutosize, TextField } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import CancelIcon from "@material-ui/icons/Cancel";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import DeleteIcon from "@material-ui/icons/Delete";

import { Spacer } from "./Spacer";
import { sharedStyles } from "./styles";

export interface SaveOptions {
    movement?: number;
    fromBlur?: boolean;
}

type EditableTextProps = {
    text?: string;
    onSave: (newText: string | undefined, options?: SaveOptions) => void;
    multiLine?: boolean;
    placeHolder?: string;
    onDelete?: (options?: SaveOptions) => void;
    holderClassName?: string;
    autoFocus?: boolean;
    isValid?: (newText: string | undefined) => string | undefined;
    withCheckbox?: boolean;
    label?: string;
    noSupressSaves?: boolean;
};
export const escapedNewLineToLineBreakTag = (string: string) => string.split('\n').map((item: string, index: number) => (index === 0) ? item : [<br key={index}/>, item])

type EditableTextState = { isEditing: boolean; value?: string };

type EditableTextAction =
    | { type: "startEdit" }
    | { type: "save"; options?: SaveOptions }
    | { type: "cancel" }
    | { type: "update"; value: string }
    ;

const useWrappedRef = <T extends any>(value: T) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
};

export const EditableText = ({
                                 text,
                                 onSave: onSaveUnsafe,
                                 multiLine,
                                 placeHolder,
                                 onDelete: onDeleteUnsafe,
                                 holderClassName,
                                 autoFocus,
                                 isValid: isValidUnsafe,
                                 withCheckbox,
                                 label,
                                 noSupressSaves,
                             }: EditableTextProps) => {
    const classes = useStyles();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [errorMessage, setErrorMessage] = useState<string>();

    const onSave = useWrappedRef(onSaveUnsafe);
    const onDelete = useWrappedRef(onDeleteUnsafe);
    const isValid = useWrappedRef(isValidUnsafe);

    const reducer = useMemo(() => {
        return (current: EditableTextState, action: EditableTextAction) => {
            switch (action.type) {
                case 'startEdit':
                    if (current.isEditing) {
                        return current;
                    }
                    return {isEditing: true, value: text ?? ""};
                case 'save':
                    if (current.isEditing) {
                        if (current.value === undefined || current.value === "") {
                            if (onDelete.current) {
                                onDelete.current(action.options);
                            } else {
                                if (isValid.current && !!isValid.current(current.value)) {
                                    alert("Not a valid value")
                                    return current;
                                } else if (placeHolder || withCheckbox) {
                                    onSave.current(undefined, action.options);
                                } else {
                                    if (text !== undefined) {
                                        // Not empty to start with
                                        alert("Cannot be empty.");
                                    }
                                    return current;
                                }
                            }
                        } else {
                            if (isValid.current && !!isValid.current(current.value)) {
                                alert("Not a valid value");
                                return current;
                            }
                            if (noSupressSaves || current.value !== text) {
                                // No changes, no save
                                onSave.current(current.value, action.options);
                            }
                        }
                    }
                    return {isEditing: false};
                case 'cancel':
                    return {isEditing: false};
                case 'update':
                    return {...current, value: action.value};
            }
        };
    }, [text, onDelete, isValid, placeHolder, withCheckbox, onSave, noSupressSaves]);
    const [state, dispatch] = useReducer(reducer, {isEditing: false});

    useEffect(() => {
        if (autoFocus === true) {
            dispatch({type: 'startEdit'});
        }
    }, [autoFocus]);

    const startEdit = useCallback(() => dispatch({type: 'startEdit'}), []);
    const save = useCallback((options?: SaveOptions) => dispatch({type: 'save', options}), []);
    const cancel = useCallback(() => dispatch({type: 'cancel'}), []);
    const setCurrent = useCallback((value: string) => {
        dispatch({type: 'update', value});
        if (isValid.current) {
            setErrorMessage(isValid.current(value));
        }
    }, [isValid]);

    const handleKey = (e: React.KeyboardEvent) => {
        if ((!multiLine || e.ctrlKey || e.metaKey) && e.key === "Enter") {
            save({movement: 1});
        } else if (e.key === "Escape") {
            cancel();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            save({movement: e.key === "ArrowUp" ? -1 : 1});
        }
    };

    const onBlur = (e: React.FocusEvent) => {
        if (wrapperRef.current && wrapperRef.current.contains(e.relatedTarget as Element)) {
            // Inside, so ignore
        } else {
            save({fromBlur: true});
        }
    };

    const selected = state.isEditing || (text !== undefined && text !== "");
    const checkboxContent = withCheckbox ? <>
        <Checkbox className={classes.editableCheckbox} checked={selected}
                  onChange={(_, checked) => {
                      if (checked) {
                          if (!state.isEditing) {
                              startEdit();
                          }
                      } else {
                          cancel();
                          onSave.current(undefined);
                      }
                  }}/>
    </> : null;

    const labelElement = label && <>{selected ?
        <em className={classes.editableLabelSelected}>{label}:</em> : label}<Spacer width={8}/></>;
    return state.isEditing ?
        <span className={classes.editableOuterWrapper} ref={wrapperRef}>
            {checkboxContent} {labelElement}
            {multiLine ?
                <TextareaAutosize rowsMax={10} autoFocus className={classes.editableInput}
                                  value={state.value}
                                  onChange={e => setCurrent(e.target.value)} onKeyDown={handleKey}
                                  placeholder={placeHolder} onBlur={onBlur}/>
                :
                <TextField autoFocus className={classes.editableInput} value={state.value}
                           onChange={e => setCurrent(e.target.value)} onKeyDown={handleKey}
                           placeholder={placeHolder} onBlur={onBlur}
                           error={!!errorMessage} helperText={errorMessage}
                           InputProps={{className: classes.editableInputInner}}
                />
            }
            <IconButton className={classes.editableInlineButton}
                        onClick={cancel}><CancelIcon/></IconButton>
            <IconButton className={classes.editableInlineButton}
                        onClick={() => save()}><CheckCircleIcon/></IconButton>
        </span>
        : multiLine ?
            <span className={classes.editableMultiline}><span
                className={classes.editableMultilineContents}
                onClick={startEdit}>
                {checkboxContent} {labelElement}
                {text === undefined ?
                    <i className={classes.placeholder}>{placeHolder}</i> : escapedNewLineToLineBreakTag(text)}</span></span>
            :
            <span className={`${classes.editableHolder} ${holderClassName ?? ""}`}
                  onClick={startEdit}>
                {checkboxContent} {labelElement}
                {text === undefined ?
                    <i className={classes.placeholder}>{placeHolder}</i> : text}<Spacer/>
                {onDelete.current &&
                <IconButton className={classes.editableInlineButton} onClick={() => onDelete.current && onDelete.current()}
                            size="small"><DeleteIcon/></IconButton>}
            </span>;
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        ...sharedStyles,
        editableOuterWrapper: {
            flexGrow: 1,
            display: 'flex',
            border: 'solid 1px transparent',
            alignItems: 'center',
        },
        editableInput: {
            font: 'inherit',
            flexGrow: 1,
            marginBottom: 3,
        },
        editableInputInner: {
            font: 'inherit',
        },
        editableHolder: {
            border: 'solid 1px transparent',
            flexGrow: 1,
            display: 'flex',
            '&:hover': {
                borderColor: theme.palette.primary.light,
            },
        },
        editableMultiline: {
            flexGrow: 1,
            display: 'flex',
            alignItems: 'start',
            border: 'solid 1px transparent',
            '&:hover': {
                borderColor: theme.palette.primary.light,
            },
        },
        editableMultilineContents: {
            flexGrow: 1,
        },
        editableCheckbox: {
            marginTop: -9,
            marginBottom: -9,
        },
        editableLabelSelected: {
            color: '#777',
        },
        placeholder: {
            color: '#777',
        },
    }),
);
