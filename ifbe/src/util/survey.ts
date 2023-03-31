import { SurveyAllocation } from '../model/surveyAllocation.model';
import { SurveyQuestion } from '../model/SurveyContent';
import { JournalEntry } from '../model/journalEntry.model';
import { Journal } from '../model/journal.model';

function formatAnswer(answer: any, question: UnpackedQuestion) {
    if (answer == null) {
        return '';
    }
    switch (question.type) {
        case 'TextQuestion':
        case 'YesNoQuestion':
        case 'ParagraphQuestion':
            return answer;
        case 'ConsentQuestion':
            return answer ? 'yes' : 'no';
        case 'ChoiceQuestion':
            return answer.value === 'other' ? question.choices.length + 1 : answer.value !== -1 ? answer.value + 1 : '';
        case 'CheckboxQuestion':
            const options = question.choices.filter((_v, index) => answer.checks?.[index]);
            if (answer.otherChecked) {
                options.push(answer.otherText);
            }
            return options.join(', ');
    }
}

export type UnpackedQuestion = {
    type: SurveyQuestion['type'];
    id: string;
    title: string;
    subQuestions: string[] | null;
    commentsPrompt: string | null;
    colCount: number;
    cols: string[] | null;
    rows: string[] | null;
    choices: string[] | null;
    allowOther: boolean;
};

export function unpackQuestions(allocation: SurveyAllocation) {
    return allocation.survey.content.content.map(c => {
        if (c.type === 'SectionHeader' || c.type === 'TextBlock') return;
        const isGridQuestion = c.type === 'ChoiceGridQuestion' || c.type === 'CheckboxGridQuestion';
        return {
            type: c.type,
            id: c.id,
            title: c.title,
            subQuestions: isGridQuestion ? c.rows : null,
            commentsPrompt: c.commentsPrompt ?? null,
            colCount: (isGridQuestion ? c.rows.length : 1) + (c.commentsPrompt ? 1 : 0) + (c.allowOther ? 1 : 0),
            cols: c.cols ?? null,
            rows: c.rows ?? null,
            choices: c.choices ?? null,
            allowOther: !!c.allowOther,
        };
    }).filter(notNull => notNull);
}

export function extractAnswer(q: UnpackedQuestion, answer) {
    if (q.subQuestions) {
        return [
            ...q.subQuestions.map((sub, index) => {
                if (q.type === 'ChoiceGridQuestion') {
                    const choice = answer?.checks?.[index] ?? null;
                    return choice === null || choice === -1 ? '' : choice + 1;
                } else if (q.type === 'CheckboxGridQuestion') {
                    const choices = answer?.checks?.[index] ?? [];
                    return q.cols.filter((col, index) => choices[index]).join(', ');
                } else {
                    return JSON.stringify({ question: q, answer: answer });
                }
            }),
            ...(q.commentsPrompt ? [answer?.otherComments] : []),
        ];
    } else if (q.allowOther) {
        return [
            formatAnswer(answer, q),
            answer && answer.value === 'other' ? answer.other : '',
        ];
    } else {
        return [formatAnswer(answer, q)];
    }
}

export function formatDatetime(date: Date | null) {
    if (date === null) {
        return null;
    }
    const isoString = date.toISOString();
    // Remove .000Z milliseconds, and Zulu timezone indicator, replace T with space
    return isoString.substr(0, isoString.length - 5).replace('T', ' ');
}
