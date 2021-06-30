import { Content } from "./SurveyContent";
import FormatLineSpacingIcon from "@material-ui/icons/FormatLineSpacing";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import { QuestionTypeInfo } from "./QuestionTypeInfo";
import React from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { ulid } from "ulid";
import Divider from "@material-ui/core/Divider";

export const ContentTypeInfo = {
    "SectionHeader": {icon: <FormatLineSpacingIcon/>, name: "Section"},
    "TextBlock": {icon: <TextFieldsIcon/>, name: "Explanatory Text"},
    ...QuestionTypeInfo
};

function getSidebarItems() {
    let index = 0;
    const pick = (type: Content["type"]) => {
        return {index: index++, ...ContentTypeInfo[type], type};
    }
    return [
        pick("SectionHeader"),
        pick("TextBlock"),
        null,
        pick("TextQuestion"),
        pick("YesNoQuestion"),
        pick("ParagraphQuestion"),
        pick("ChoiceQuestion"),
        pick("CheckboxQuestion"),
        pick("ChoiceGridQuestion"),
        pick("CheckboxGridQuestion"),
        null,
        pick("JournalQuestion"),
        null,
        pick("ConsentQuestion"),
    ];
}

const sidebarItems: ({ index: number; icon: any; name: string; type: Content["type"] } | null)[] = getSidebarItems();

interface SidebarProps {
    addItem: (newContent: Content) => void;
}

export function Sidebar({addItem}: SidebarProps) {
    return <Droppable droppableId="palette" isDropDisabled={true}>
        {provided =>
            <List ref={provided.innerRef}>
                {sidebarItems.map((item, index) => (
                    item ?
                        <Draggable key={item.type} draggableId={item.type}
                                   index={item.index}>
                            {(provided, snapshot) =>
                                snapshot.isDragging ?
                                    <>
                                        <ListItem button ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}>
                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.name}/>
                                        </ListItem>
                                        <ListItem button>
                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.name}/>
                                        </ListItem>
                                    </>
                                    :
                                    <ListItem button ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              onClick={() => {
                                                  const id = ulid();
                                                  const newItem = {type: item.type, id};
                                                  addItem(newItem);
                                              }}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.name}/>
                                    </ListItem>
                            }
                        </Draggable>
                        : <Divider key={index}/>
                ))}
                {provided.placeholder}
            </List>
        }
    </Droppable>;
}
