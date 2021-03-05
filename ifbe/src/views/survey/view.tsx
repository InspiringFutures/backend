import * as React from 'react'
import { Survey } from "../../model/survey.model";
import { useUrlBuilder, wrap } from "../wrapper";
import { AccessLevel } from "../../model/accessLevels";
import { AdminManagement } from "../util/permissions";
import { SurveyAllocation } from '../../model/surveyAllocation.model';
import { Group } from '../../model/group.model';
import { Admin } from '../../model/admin.model';


type Allocation = SurveyAllocation & { group: Group; creator: Admin };

interface Props {
    groups: Array<Group & { permission: AccessLevel }>;
    survey: Omit<Survey, 'allocations'> & {permission: AccessLevel} & {allocations: Allocation[]};
}

function formatDatetime(date: Date|null) {
    if (date === null) {
        return null;
    }
    const isoString = date.toISOString();
    return isoString.substr(0, isoString.length - 8); // Remove :00.000Z seconds, milliseconds, and Zulu timezone indicator
}

const TimedAllocationRow = ({allocation}: {allocation: Allocation}) => {
    const urlBuilder = useUrlBuilder();

    const now = formatDatetime(new Date());
    const url = urlBuilder.build('allocation/' + allocation.id);
    return <tr>
        <form method="POST" action={url}>
            <td>{allocation.group.name}</td>
            <td><textarea name="note" defaultValue={allocation.note} /></td>
            <td><input name="openAt" type="datetime-local" min={now} value={formatDatetime(allocation.openAt)} /></td>
            <td><input name="closeAt" type="datetime-local" min={now} value={formatDatetime(allocation.closeAt)} /></td>
            <td>{allocation.creator.name}</td>
            <td><input type="submit" value="Update" /></td>
        </form>
        <td>
            <form method="POST" action={url + "/delete"}>
                <input type="submit" value="Delete" />
            </form>
        </td>
    </tr>;
};

const InitialAllocationRow = ({allocation}: {allocation: Allocation}) => {
    const urlBuilder = useUrlBuilder();
    const url = urlBuilder.build('allocation/' + allocation.id);

    return <tr>
        <form method="POST" action={url}>
            <td>{allocation.group.name}</td>
            <td><textarea name="note" defaultValue={allocation.note} /></td>
            <td>{allocation.creator.name}</td>
            <td><input type="submit" value="Update" /></td>
        </form>
        <td>
            <form method="POST" action={url + "/delete"}>
                <input type="submit" value="Delete" />
            </form>
        </td>
    </tr>;
};

const SurveyView = wrap(({groups, survey}: Props) => {
    const urlBuilder = useUrlBuilder();
    const owner = survey.permission === AccessLevel.owner;
    const editable = survey.permission !== AccessLevel.view;

    const now = formatDatetime(new Date());
    const url = urlBuilder.build('allocation');

    return (<body>
    <h1>Survey: {survey.name}</h1>
    {owner && <p>You are an owner of this survey.</p>}
    <p>Last modified by {survey.updater.name} at {survey.updatedAt.toLocaleString()}.</p>
    {editable && <p><a href={urlBuilder.build('edit')}>Edit survey</a></p>}

    <h2>Allocated to the following groups</h2>
    <table>
        <tbody>
        <tr><th>Group</th><th>Notes</th><th>Opens at</th><th>Closes at</th><th>Allocated by</th><th colSpan={2}>&nbsp;</th></tr>
        {survey.allocations.filter(a => a.type !== 'initial').map(allocation =>
            <TimedAllocationRow key={allocation.id} allocation={allocation} />
        )}
        <tr><th colSpan={7}>Allocate to another group</th></tr>
        <tr>
            <form method="POST" action={url}>
                <input type="hidden" name="type" value="oneoff" />
                <td><select name="groupId" required={true}>
                    {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select></td>
                <td><textarea name="note" /></td>
                <td><input name="openAt" type="datetime-local" min={now}  /></td>
                <td><input name="closeAt" type="datetime-local" min={now} /></td>
                <td colSpan={2}><input type="submit" value="Add" /></td>
            </form>
        </tr>
        </tbody>
    </table>

    <h2>Sign up survey for following groups</h2>
    <table>
        <tbody>
        <tr><th>Group</th><th>Notes</th><th>Allocated by</th><th colSpan={2}>&nbsp;</th></tr>
        {survey.allocations.filter(a => a.type === 'initial').map(allocation =>
            <InitialAllocationRow key={allocation.id} allocation={allocation} />
        )}
        <tr><th colSpan={5}>Allocate to another group</th></tr>
        <tr>
            <form method="POST" action={url}>
                <input type="hidden" name="type" value="initial" />
                <td><select name="groupId" required={true}>
                    {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select></td>
                <td><textarea name="note" /></td>
                <td colSpan={2}><input type="submit" value="Add" /></td>
            </form>
        </tr>
        </tbody>
    </table>

    <h2>Other survey users</h2>
    <AdminManagement on={survey} permissionName="SurveyPermission" />
    </body>)
});

export default SurveyView;
