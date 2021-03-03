import React, { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { EditableText, SaveOptions } from "./EditableText";
import Typography from "@material-ui/core/Typography";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import { Spacer } from "./Spacer";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { sharedStyles } from "./styles";

interface EditableTextArrayProps {
    onSave: (newEntries: string[]) => void;
    entries: string[];
    placeholder: string;
    heading: string;
}

export function EditableTextArray({onSave, entries, placeholder, heading}: EditableTextArrayProps) {
    const [selectedIndex, setSelectedIndex] = useState<number>();
    const classes = useStyles();

    function handleDrag(drop: DropResult) {
        if (drop.reason === 'CANCEL') {
            return;
        }
        if (drop.source.index === drop.destination!.index) return;
        const newEntries = [...entries];
        const removed = newEntries.splice(drop.source.index, 1);
        newEntries.splice(drop.destination?.index!, 0, ...removed);
        onSave(newEntries);
        setSelectedIndex(undefined);
    }

    function save(index: number, text: string | undefined, options?: SaveOptions) {
        console.log("save", index, text, options);
        if (entries[index] !== text) {
            const newEntries = [...entries];
            if (text === undefined) {
                newEntries.splice(index, 1);
            } else {
                newEntries.splice(index, 1, text);
            }
            onSave(newEntries);
        }
        let newIndex = undefined;
        if (options && options.movement !== undefined) {
            newIndex = index + options.movement;
            if (text === undefined && newIndex > index) {
                newIndex--; // If we deleted something, we need to account for it in the new index.
            }
        }
        setSelectedIndex(newIndex);
    }

    // This is a hack: going up from the top item sets selectedIndex to -1, clearing autoFocus, then
    // this sets it again
    useEffect(() => {
        if (selectedIndex === -1) {
            setSelectedIndex(0);
        }
    }, [selectedIndex]);

    const isValid = (index: number) => (value: string | undefined) => {
        if (value === undefined || value === "") return;
        const foundIndex = entries.findIndex((test, testIndex) => {
            return testIndex !== index && value === test;
        });
        if (foundIndex !== -1) {
            return "Duplicate option";
        }
    };

    return <Typography variant="body1">
        <div className={classes.editableTextArrayHeading}>{heading}</div>
        <DragDropContext onDragEnd={handleDrag}>
            <Droppable droppableId="editableTextArray">
                {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                    {entries.map((entry, index) => {
                        return <Draggable key={index + ":" + entry} draggableId={"D" + index} index={index}>
                            {(provided) =>
                                <div className={classes.editableTextArrayDraggable}
                                     ref={provided.innerRef} {...provided.draggableProps}>
                                    <span
                                        className={classes.editableTextArrayDragHandle} {...provided.dragHandleProps}><DragIndicatorIcon/></span>
                                    <EditableText autoFocus={selectedIndex === index}
                                                  isValid={isValid(index)} text={entry}
                                                  noSupressSaves
                                                  onSave={(text, options) => save(index, text, options)}
                                                  onDelete={(options) => save(index, undefined, options)}/>
                                </div>
                            }
                        </Draggable>;
                    })}
                    {provided.placeholder}
                </div>)}
            </Droppable>
        </DragDropContext>
        <div className={classes.editableTextArrayAddRow}>
            <EditableText key={entries.length} autoFocus={selectedIndex === entries.length}
                          isValid={isValid(-1)} holderClassName={classes.editableTextArrayAddText}
                          noSupressSaves
                          placeHolder={placeholder} onSave={(text, options) => {
                let newIndex;
                if (text) {
                    const newEntries = [...entries, text];
                    onSave(newEntries);
                    newIndex = newEntries.length;
                }
                if (options && options.movement !== undefined) {
                    newIndex = entries.length + options.movement;
                }
                setSelectedIndex(newIndex);
            }}
            />
        </div>
        <Spacer/>
    </Typography>;
}


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        ...sharedStyles,
        editableTextArrayDraggable: {
            display: 'flex',
            flexGrow: 1,
        },
        editableTextArrayDragHandle: {
            alignSelf: 'center',
            width: 31,
            color: '#ddd',
            '&:hover': {
                color: '#777',
            },
        },
        editableTextArrayHeading: {
            marginLeft: 31,
            fontWeight: 'bold',
        },
        editableTextArrayAddRow: {
            display: 'flex',
            marginLeft: 31,
        },
        editableTextArrayAddText: {
            paddingTop: 5,
            paddingBottom: 5,
        },
    }),
);
