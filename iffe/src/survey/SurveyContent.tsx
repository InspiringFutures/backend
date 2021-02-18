export interface Content {
    readonly type: SurveyContent["type"];
    id: string;
    title?: string;
    description?: string;
}

export interface SectionHeader extends Content {
    readonly type: "SectionHeader";
}

export interface TextBlock extends Content {
    readonly type: "TextBlock";
}

export interface Question extends Content {
    readonly type: SurveyQuestion["type"];
    questionNumber?: number;
}

export interface TextQuestion extends Question {
    readonly type: "TextQuestion";
    placeholder?: string;
}

export interface YesNoQuestion extends Question {
    readonly type: "YesNoQuestion";
}

export interface ParagraphQuestion extends Question {
    readonly type: "ParagraphQuestion";
    placeholder?: string;
}

export interface ChoiceQuestion extends Question {
    readonly type: "ChoiceQuestion";
    choices?: string[];
    allowOther?: boolean;
}

export interface ChoiceGridQuestion extends Question {
    readonly type: "ChoiceGridQuestion";
    rows?: string[];
    columns?: string[];
}


export type SurveyQuestion = TextQuestion | YesNoQuestion | ParagraphQuestion | ChoiceQuestion | ChoiceGridQuestion;
export type SurveyContent = SectionHeader | TextBlock | SurveyQuestion;

export function isQuestion(c: Content): c is Question {
    return !(c.type === 'SectionHeader' || c.type === 'TextBlock');
}

export function isSectionHeader(c: Content): c is SectionHeader {
    return c.type === 'SectionHeader';
}
