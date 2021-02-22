import React from "react";

import ShortTextIcon from "@material-ui/icons/ShortText";
import ThumbsUpDownIcon from "@material-ui/icons/ThumbsUpDown";
import ViewHeadlineIcon from "@material-ui/icons/ViewHeadline";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import GridOnIcon from "@material-ui/icons/GridOn";
import HowToRegIcon from "@material-ui/icons/HowToReg";

import { Question } from "./SurveyContent";
import { TypeInfo } from "./TypeMenu";

export const QuestionTypeInfo: TypeInfo<Question["type"]> = {
    "TextQuestion": {icon: <ShortTextIcon/>, name: "Short answer"},
    "YesNoQuestion": {icon: <ThumbsUpDownIcon/>, name: "Yes/no"},
    "ParagraphQuestion": {icon: <ViewHeadlineIcon/>, name: "Paragraph"},
    "ChoiceQuestion": {icon: <RadioButtonCheckedIcon/>, name: "Choice"},
    "CheckboxQuestion": {icon: <CheckBoxIcon/>, name: "Checkboxes"},
    "ChoiceGridQuestion": {icon: <DragIndicatorIcon/>, name: "Choice grid"},
    "CheckboxGridQuestion": {icon: <GridOnIcon/>, name: "Checkbox grid"},
    "ConsentQuestion": {icon: <HowToRegIcon/>, name: "Consent"}
};
