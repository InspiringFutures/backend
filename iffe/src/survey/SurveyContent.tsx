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

export interface TextQuestion extends Content {
    readonly type: "TextQuestion";
    placeholder?: string;
}

type SurveyContent = SectionHeader | TextBlock | TextQuestion;

export type SurveyContentTypes = {
    SectionHeader: SectionHeader;
    TextBlock: TextBlock;
    TextQuestion: TextQuestion;
}
