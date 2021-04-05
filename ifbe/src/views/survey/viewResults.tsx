import * as React from 'react'
import { Survey } from "../../model/survey.model";
import { useUrlBuilder, wrap } from "../wrapper";
import { AccessLevel } from "../../model/accessLevels";
import { AdminManagement, PermissionExplanation } from '../util/permissions';
import { SurveyAllocation } from '../../model/surveyAllocation.model';
import { Group } from '../../model/group.model';
import { Admin } from '../../model/admin.model';
import { Client } from '../../model/client.model';
import { Answer } from '../../model/answer.model';
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
    return isoString.substr(0, isoString.length - 8); // Remove :00.000Z seconds, milliseconds, and Zulu timezone indicator
}

function format(answer: any, question: UnpackedQuestion) {
    if (answer === null) {
        return <em>?</em>;
    }
    switch (question.type) {
        case 'TextQuestion':
        case 'YesNoQuestion':
        case 'ParagraphQuestion':
            return answer;
        case 'ConsentQuestion':
            return answer ? 'Yes' : 'No';
        case 'ChoiceQuestion':
            if (answer.value === 'other') {
                return answer.other;
            }
            return question.choices[answer.value];
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
            colCount: (isGridQuestion ? c.rows.length : 1) + (c.commentsPrompt ? 1 : 0),
            cols: c.cols ?? null,
            rows: c.rows ?? null,
            choices: c.choices ?? null,
       };
    }).filter(notNull => notNull);

    const clientMap = {};
    clients.forEach(client => clientMap[client.id] = client);

    return (<body>
    <h1>Survey results</h1>
    <p><b>Group:</b> {group.name}</p>
    <p><b>Survey:</b> {allocation.survey.name}</p>
    <table>
        <thead>
            <tr>
                <th rowSpan={2}>Client</th>
                {questions.map((q) => {
                    if (q.subQuestions) {
                        return <th key={q.id} colSpan={q.colCount}>{q.title}</th>;
                    }
                    return <th key={q.id} rowSpan={2}>{q.title}</th>;
                })}
            </tr>
            <tr>
                {questions.map((q) => {
                    return <React.Fragment key={q.id}>
                        {q.subQuestions && q.subQuestions.map((sub, index) => <th key={index}>{sub}</th>)}
                        {q.commentsPrompt && <th key="commentsPrompt">{q.commentsPrompt}</th>}
                    </React.Fragment>;
                })}
            </tr>
        </thead>
        <tbody>
            {allocation.answers.map(answer => {
                const answerMap = answer.answer.answers;
                return <tr key={answer.id}>
                    <td>{clientMap[answer.clientId].participantID}</td>
                    {answer.answer.complete ?
                        questions.map((q) => {
                            const answer = answerMap[q.id];
                            console.log(q, answer);
                            if (q.subQuestions) {
                                return <React.Fragment key={q.id}>
                                    {q.subQuestions && q.subQuestions.map((sub, index) => {
                                        // FIXME: do CheckboxGridQuestion
                                        const choice = answer?.checks?.[index] ?? null;
                                        return <td key={index}>{choice === null || choice === -1 ? '?' : choice + 1}</td>;
                                    })}
                                    {q.commentsPrompt && <td key="otherComments">{answer?.otherComments}</td>}
                                </React.Fragment>;
                            } else {
                                return <td key={q.id}>{format(answer, q)}</td>;
                            }
                        })
                        : <td>Not answered</td>
                    }
                </tr>;
            })}
        </tbody>
    </table>

    </body>)
});

export default SurveyResultsView;
