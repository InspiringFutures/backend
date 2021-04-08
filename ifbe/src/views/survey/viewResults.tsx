import * as React from 'react'
import { wrap } from "../wrapper";
import { SurveyAllocation } from '../../model/surveyAllocation.model';
import { Group } from '../../model/group.model';
import { Client } from '../../model/client.model';
import { SurveyQuestion } from '../../model/SurveyContent';


interface Props {
    group: Group;
    clients: Client[];
    allocation: SurveyAllocation;
}

function formatDatetime(date: Date|null) {
    if (date === null) {
        return null;
    }
    const isoString = date.toISOString();
    // Remove .000Z milliseconds, and Zulu timezone indicator, replace T with space
    return isoString.substr(0, isoString.length - 5).replace('T', ' ');
}

function format(answer: any, question: UnpackedQuestion) {
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
            const options = question.choices.filter((_v, index) => answer.checks[index]);
            if (answer.otherChecked) {
                options.push(answer.otherText);
            }
            return options.join(", ");
    }
}

type UnpackedQuestion = {
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

const SurveyResultsView = wrap(({group, clients, allocation}: Props) => {
    const questions: UnpackedQuestion[] = allocation.survey.content.content.map(c => {
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

    const clientMap = {};
    clients.forEach(client => clientMap[client.id] = client);

    const total = questions.reduce((sum, q) => sum + q.colCount, 0);

    const minor = {borderRight: 'solid 1px #ddd'};
    const major = {borderRight: 'solid 1px #bbb'};
    const box = {borderBottom: major.borderRight, ...major};
    const subBox = {borderBottom: minor.borderRight, ...major};

    return (<body>
    <h1>Survey results</h1>
    <p><b>Group:</b> {group.name}</p>
    <p><b>Survey:</b> {allocation.survey.name}</p>
    <table cellSpacing={0} style={{borderCollapse: 'collapse', padding: '4px', borderLeft: box.borderBottom, borderBottom: box.borderBottom}}>
        <thead>
            <tr style={{borderTop: 'solid 1px #bbb'}}>
                <th rowSpan={2} style={box}>Participant</th>
                <th rowSpan={2} style={box}>Completed date</th>
                {questions.map((q) => {
                    if (q.colCount > 1) {
                        return <th key={q.id} colSpan={q.colCount} style={subBox}>{q.title}</th>;
                    }
                    return <th key={q.id} rowSpan={2} style={box}>{q.title}</th>;
                })}
            </tr>
            <tr style={box}>
                {questions.map((q) => {
                    return <React.Fragment key={q.id}>
                        {q.subQuestions && q.subQuestions.map((sub, index) => <th key={index} style={index === q.colCount - 1 ? major : minor}>{sub}</th>)}
                        {q.commentsPrompt && <th key="commentsPrompt" style={major}>{q.commentsPrompt}</th>}
                        {q.allowOther && <th key="choice" style={minor}>Choice</th>}
                        {q.allowOther && <th key="allowOther" style={major}>Other (choice {q.choices.length + 1})</th>}
                    </React.Fragment>;
                })}
            </tr>
        </thead>
        <tbody>
            {allocation.answers.map((answer, rowIndex) => {
                const answerMap = answer.answer.answers;
                return <tr key={answer.id} style={rowIndex % 2 === 0 ? {backgroundColor: '#f4f4f4'} : undefined}>
                    <td style={major}>{clientMap[answer.clientId].participantID}</td>
                    <td style={major}>{answer.answer.complete ? formatDatetime(answer.updatedAt) : ''}</td>
                    {answer.answer.complete ?
                        questions.map((q) => {
                            const answer = answerMap[q.id];
                            if (q.subQuestions) {
                                return <React.Fragment key={q.id}>
                                    {q.subQuestions && q.subQuestions.map((sub, index) => {
                                        if (q.type === 'ChoiceGridQuestion') {
                                            const choice = answer?.checks?.[index] ?? null;
                                            return <td key={index} style={index === q.colCount - 1 ? major : minor}>{choice === null || choice === -1 ? '' : choice + 1}</td>;
                                        } else if (q.type === 'CheckboxGridQuestion') {
                                            const choices = answer?.checks?.[index] ?? [];
                                            return <td key={index} style={index === q.colCount - 1 ? major : minor}>{q.cols.filter((col, index) => choices[index]).join(", ")}</td>;
                                        } else {
                                            return <td key={index}>{JSON.stringify({question: q, answer: answer})}</td>;
                                        }
                                    })}
                                    {q.commentsPrompt && <td key="otherComments" style={major}>{answer?.otherComments}</td>}
                                </React.Fragment>;
                            } else if (q.allowOther) {
                                return <React.Fragment key={q.id}>
                                    <td style={minor}>{format(answer, q)}</td>
                                    <td style={major}>{answer && answer.value === 'other' ? answer.other : ''}</td>
                                </React.Fragment>;
                            } else {
                                return <td key={q.id} style={major}>{format(answer, q)}</td>;
                            }
                        })
                        : <td colSpan={total} style={major}>Not answered</td>
                    }
                </tr>;
            })}
        </tbody>
    </table>

    </body>)
});

export default SurveyResultsView;
