export type TextWithOptionalAudio = string | {
    text: string;
    audio?: string;
};

export interface Content {
    readonly type: SurveyContent['type'];
    id: string;
    originId?: string;
}

export interface SectionHeader extends Content {
    readonly type: 'SectionHeader';
    title?: string;
    description?: TextWithOptionalAudio;
}

export interface TextBlock extends Content {
    readonly type: 'TextBlock';
    title?: TextWithOptionalAudio;
}

export interface Question extends Content {
    readonly type: SurveyQuestion['type'];
    title?: TextWithOptionalAudio;
    description?: TextWithOptionalAudio;
    questionNumber?: number;
}

export interface TextQuestion extends Question {
    readonly type: 'TextQuestion';
    placeholder?: string;
}

export interface YesNoQuestion extends Question {
    readonly type: 'YesNoQuestion';
}

export interface ConsentQuestion extends Question {
    readonly type: 'ConsentQuestion';
}

export interface ParagraphQuestion extends Question {
    readonly type: 'ParagraphQuestion';
    placeholder?: string;
}

export interface ChoiceQuestion extends Question {
    readonly type: 'ChoiceQuestion';
    choices?: TextWithOptionalAudio[];
    allowOther?: boolean;
}

export interface CheckboxQuestion extends Question {
    readonly type: 'CheckboxQuestion';
    choices?: TextWithOptionalAudio[];
    allowOther?: boolean;
}

export interface CheckboxGridQuestion extends Question {
    readonly type: 'CheckboxGridQuestion';
    rows?: TextWithOptionalAudio[];
    columns?: string[];
    commentsPrompt?: TextWithOptionalAudio;
}

export interface ChoiceGridQuestion extends Question {
    readonly type: 'ChoiceGridQuestion';
    rows?: TextWithOptionalAudio[];
    columns?: string[];
    commentsPrompt?: TextWithOptionalAudio;
}

export interface JournalQuestion extends Question {
    readonly type: 'JournalQuestion';
}

export type SurveyQuestion =
    | TextQuestion
    | YesNoQuestion
    | ConsentQuestion
    | ParagraphQuestion
    | ChoiceQuestion
    | ChoiceGridQuestion
    | CheckboxQuestion
    | CheckboxGridQuestion
    | JournalQuestion;

export type SurveyContent = SectionHeader | TextBlock | SurveyQuestion;

export function isQuestion(c: Content): c is Question {
    return !(c.type === 'SectionHeader' || c.type === 'TextBlock');
}

export function isSectionHeader(c: Content): c is SectionHeader {
    return c.type === 'SectionHeader';
}
