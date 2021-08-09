import * as React from 'react'
import { Survey } from "../../model/survey.model";
import { useUrlBuilder, wrap } from "../wrapper";
import { AccessLevel } from "../../model/accessLevels";
import { AdminManagement, PermissionExplanation } from '../util/permissions';
import { SurveyAllocation } from '../../model/surveyAllocation.model';
import { Group } from '../../model/group.model';
import { Admin } from '../../model/admin.model';


type Allocation = SurveyAllocation & { group: Group; creator: Admin };

interface Props {
    groups: Array<Group & { permission: AccessLevel }>;
    survey: Omit<Survey, 'allocations'> & {permission: AccessLevel} & {allocations: Allocation[]};
}

function formatDate(date: Date|null) {
    if (date === null) {
        return null;
    }
    const isoString = date.toISOString();
    return isoString.substr(0, isoString.length - 14); // Remove T00:00:00.000Z i.e. time including milliseconds and Zulu timezone indicator
}

let lastAllocation = null;
const TimedAllocationRow = ({allocation}: {allocation: Allocation}) => {
    const urlBuilder = useUrlBuilder();

    const url = urlBuilder.build('allocation/' + allocation.id);
    const isGroupRepeat = lastAllocation !== null && lastAllocation.groupId === allocation.groupId;
    const isNewGroupHeader = lastAllocation !== null && !isGroupRepeat;
    lastAllocation = allocation;
    const row = <tr>
        <form method="POST" action={url}>
            <td>
                {isGroupRepeat ? "" : <a href={urlBuilder.absolute(`/admin/group/${allocation.groupId}`)}>{allocation.group.name}</a>}
            </td>
            <td><textarea name="note" defaultValue={allocation.note} /></td>
            <td><input name="openAt" type="date" value={formatDate(allocation.openAt)} /></td>
            <td><input name="dueAt" type="date" value={formatDate(allocation.dueAt)} /></td>
            <td><input name="closeAt" type="date" value={formatDate(allocation.closeAt)} /></td>
            <td>{allocation.creator.name}</td>
            <td><input type="submit" value="Save" /></td>
        </form>
        <td>
            <form method="POST" action={url + "/delete"}>
                <input type="submit" value="Delete" />
            </form>
        </td>
        <td>
            <a href={url + "/results"}>View results</a>
        </td>
    </tr>;
    return isNewGroupHeader ? <><tr><td colSpan={7}><hr /></td></tr>{row}</> : row;
};

const InitialAllocationRow = ({allocation}: {allocation: Allocation}) => {
    const urlBuilder = useUrlBuilder();
    const url = urlBuilder.build('allocation/' + allocation.id);

    return <tr>
        <form method="POST" action={url}>
            <td><a href={urlBuilder.absolute(`/admin/group/${allocation.groupId}`)}>{allocation.group.name}</a></td>
            <td><textarea name="note" defaultValue={allocation.note} /></td>
            <td>{allocation.creator.name}</td>
            <td><input type="submit" value="Save" /></td>
        </form>
        <td>
            <form method="POST" action={url + "/delete"}>
                <input type="submit" value="Delete" />
            </form>
        </td>
        <td>
            <a href={url + "/results"}>View results</a>
        </td>
    </tr>;
};

const SurveyView = wrap(({groups, survey}: Props) => {
    const urlBuilder = useUrlBuilder();
    const owner = survey.permission === AccessLevel.owner;
    const editable = survey.permission !== AccessLevel.view && survey.allocations.length === 0;
    const locked = survey.permission !== AccessLevel.view && survey.allocations.length > 0;

    const now = formatDate(new Date());
    const url = urlBuilder.build('allocation');

    return (<body>
    <form method="POST" action={urlBuilder.build()}>
        <h1>Survey: <input style={{font: 'inherit', border: '1px solid #ccc'}} name="name" value={survey.name} /> &nbsp; <input type="submit" value="Save" /></h1>
    </form>
    <p><a href="/admin">Back to admin area</a></p>
    {owner && <p>You are an owner of this survey.<br />
        <form style={{marginLeft: '1em'}} method="POST" action={urlBuilder.build('delete')}>
          <p>Deallocate and delete this survey <input type="submit" value="Delete survey" /></p>
        </form>
    </p>}
    <p>Last modified by {survey.updater.name} at {survey.updatedAt.toLocaleString()}.</p>
    {editable && <p><a href={urlBuilder.build('edit')}>Edit survey</a></p>}
    {locked && <p><em>This survey has been allocated and therefore can no longer be edited.</em></p>}

    <h2>Allocated to the following groups</h2>
    <table>
        <tbody>
        <tr><th>Group</th><th>Notes</th><th>Opens at</th><th>Due at</th><th>Closes at</th><th>Allocated by</th><th colSpan={3}>&nbsp;</th></tr>
        {survey.allocations.filter(a => a.type !== 'initial').map(allocation =>
            <TimedAllocationRow key={allocation.id} allocation={allocation} />
        )}
        <tr><th colSpan={8}><hr /></th></tr>
        <tr><th colSpan={2} align="left">Allocate to another group</th><th colSpan={6}>&nbsp;</th></tr>
        <tr>
            <form method="POST" action={url}>
                <input type="hidden" name="type" value="oneoff" />
                <td><select name="groupId" required={true}>
                    {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select></td>
                <td><textarea name="note" /></td>
                <td><input name="openAt" type="date" min={now}  /></td>
                <td><input name="dueAt" type="date" min={now}  /></td>
                <td><input name="closeAt" type="date" min={now} /></td>
                <td colSpan={3}><input type="submit" value="Add" /></td>
            </form>
        </tr>
        </tbody>
    </table>

    <h2>Allocated as required initial sign up survey for following groups</h2>
    <table>
        <tbody>
        <tr><th>Group</th><th>Notes</th><th>Allocated by</th><th colSpan={3}>&nbsp;</th></tr>
        {survey.allocations.filter(a => a.type === 'initial').map(allocation =>
            <InitialAllocationRow key={allocation.id} allocation={allocation} />
        )}
        <tr><th colSpan={6}><hr /></th></tr>
        <tr><th colSpan={2} align="left">Allocate to another group</th><th colSpan={4}>&nbsp;</th></tr>
        <tr>
            <form method="POST" action={url}>
                <input type="hidden" name="type" value="initial" />
                <td><select name="groupId" required={true}>
                    {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select></td>
                <td><textarea name="note" /></td>
                <td colSpan={3}><input type="submit" value="Add" /></td>
            </form>
        </tr>
        </tbody>
    </table>

    <h2>Other survey admins</h2>
    <AdminManagement on={survey} permissionName="SurveyPermission" permissionExplanation={permissionExplanation} />
    </body>)
});

export default SurveyView;

const permissionExplanation: PermissionExplanation = (level: AccessLevel) => {
    switch (level) {
        case AccessLevel.view:
            return '(can view and allocate this survey)';
        case AccessLevel.edit:
            return '(can edit and allocate this survey)';
        case AccessLevel.owner:
            return '(can change survey and add other admins)';
    }
};
