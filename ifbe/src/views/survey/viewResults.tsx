import * as React from 'react';
import { useUrlBuilder, wrap } from '../wrapper';
import { SurveyAllocation } from '../../model/surveyAllocation.model';
import { Group } from '../../model/group.model';
import { Client } from '../../model/client.model';
import {
    extractAnswer,
    formatDatetime,
    UnpackedQuestion,
    unpackQuestions,
} from '../../util/survey';
import { EntryRow } from '../admin/client';
import { Journal } from '../../model/journal.model';


interface Props {
    group: Group;
    clients: Client[];
    allocation: SurveyAllocation;
    journals: {[answerId: string]: {[questionId: string]: Journal[]}};
}

const SurveyResultsView = wrap(({group, clients, allocation, journals}: Props) => {
    const urlBuilder = useUrlBuilder();
    const questions: UnpackedQuestion[] = unpackQuestions(allocation);

    function accessStorage(clientId: number, journalId: number, entryId: number) {
        return urlBuilder.absolute(`/admin/group/${group.id}/client/${clientId}/journal/${journalId}/entry/${entryId}/raw`);
    }

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
    {allocation.openAt && <p><b>Open at:</b> {allocation.openAt.toLocaleDateString()}</p>}
    {allocation.dueAt && <p><b>Due at:</b> {allocation.dueAt.toLocaleDateString()}</p>}
    {allocation.closeAt && <p><b>Close at:</b> {allocation.closeAt.toLocaleDateString()}</p>}
    <p><a href={urlBuilder.build(".csv")}>Download results</a></p>
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
            {allocation.answers.map((answerSet, rowIndex) => {
                const answerMap = answerSet.answer.answers;
                return <tr key={answerSet.id} style={rowIndex % 2 === 0 ? {backgroundColor: '#f4f4f4'} : undefined}>
                    <td style={major}>{clientMap[answerSet.clientId].participantID}</td>
                    <td style={major}>{answerSet.answer.complete ? formatDatetime(answerSet.updatedAt) : ''}</td>
                    {answerSet.answer.complete ?
                        questions.map((q) => {
                            if (q.type === 'JournalQuestion') {
                                // Get journals
                                const journalList = journals?.[answerSet.id]?.[q.id] ?? [];
                                return <td key={q.id} style={major}>{
                                    journalList.map((journal: Journal) => <EntryRow key={journal.id} accessStorage={accessStorage} entry={journal} />)
                                }</td>;
                            }
                            const answer = answerMap[q.id];
                            const answerList = extractAnswer(q, answer);
                            if (answerList.length === 1) {
                                return <td key={q.id} style={major}>{answerList[0]}</td>;
                            } else {
                                return <React.Fragment key={q.id}>
                                    {answerList.map((a, index) => {
                                        return <td key={index}
                                                   style={index === answerList.length - 1 ? major : minor}>
                                            {a}
                                        </td>;
                                    })}
                                </React.Fragment>
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
