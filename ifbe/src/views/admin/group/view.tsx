import * as React from 'react'
import { Group } from "../../../model/group.model";
import { useUrlBuilder, wrap } from "../../wrapper";
import { Client, ClientStatus as CS } from '../../../model/client.model';
import { AccessLevel } from "../../../model/accessLevels";
import { AdminManagement, PermissionExplanation } from '../../util/permissions';
import { SurveyAllocation } from '../../../model/surveyAllocation.model';

interface Props {
    group: Group & {permission: AccessLevel};
    allocations: SurveyAllocation[];
}

const ClientRow = ({client, editable, clientURL}: {client: Client; editable: boolean, clientURL: string}) => {
    const urlBuilder = useUrlBuilder();

    const clientStatusForm = (newStatus, label) => {
        return <form style={{display: "inline"}} method="POST"
              action={urlBuilder.build('client/' + client.id + '/status')}>
            <input type="hidden" name="newStatus" value={newStatus} />
            <input type="submit" value={label} />
        </form>;
    };

    const resetForm = () => {
        return <form
          style={{display: "inline"}}
          method="POST"
          action={urlBuilder.build('client/' + client.id + '/reset')}>
            <input type="submit" value="Reset Access" />
        </form>;
    };

    return <tr>
        <td><a href={clientURL}>{client.participantID}</a></td>
        <td>{client.status}</td>
        <td>{editable && <>
            {client.status === CS.added && clientStatusForm(CS.deleted, 'Delete')}
            {client.status === CS.registered && clientStatusForm(CS.suspended, 'Suspend')}
            {client.status === CS.suspended && clientStatusForm(CS.registered, 'Reinstate')}
            {client.status === CS.deleted && clientStatusForm(CS.added, 'Restore')}
        </>}</td>
        <td>{editable && resetForm()}</td>
    </tr>;
};

function formatDatetime(date: Date) {
    if (date === null) {
        return "Anytime";
    } else {
        return date.toISOString().substr(0, 4+3+3+3+3).replace("T", " ");
    }
}

const GroupView = wrap(({group, allocations}: Props) => {
    const urlBuilder = useUrlBuilder();
    const owner = group.permission === AccessLevel.owner;
    const editable = group.permission !== AccessLevel.view;

    const clients = group.clients;
    clients.sort((a, b) => {
        return a.participantID.localeCompare(b.participantID);
    });
    const anyAddedClients = clients.some(c => c.status === CS.added);

    const groupCodeURL = urlBuilder.absolute(`/api/group/token/${group.code}`);

    const clientURL = (client: Client) => {
        return urlBuilder.build(`client/${client.id}`);
    }

    const oneoffAllocations = allocations.filter(a => a.type === 'oneoff');
    const initialAllocation = allocations.find(a => a.type === 'initial');

    function surveyLink(allocation: SurveyAllocation) {
        return <a href={urlBuilder.absolute(`/survey/${allocation.survey.id}`)}>{allocation.survey.name}</a>;
    }

    function surveyResultsLink(allocation: SurveyAllocation) {
        return <a href={urlBuilder.absolute(`/survey/${allocation.id}/results`)}>View results</a>;
    }

    return (<body>
    <h1>Group: {group.name}</h1>
    <p><a href="/admin">Back to admin area</a></p>
    <p>Code: {group.code}</p>
    <p>Group registration QR code<br /><img src={urlBuilder.build('/qr', {url: groupCodeURL})} /><br /><a href={groupCodeURL}>{groupCodeURL}</a></p>
    {owner && <p>You are an owner of this group.</p>}
    <h2>Participants</h2>
    <table>
        <tr>
            <th>Participant ID</th>
            <th>Status</th>
            <th colSpan={2} />
        </tr>
        {clients.map(client => <ClientRow key={client.id} client={client} clientURL={clientURL(client)} editable={editable} />)}
    </table>
    {clients.length === 0 && <em>There are currently no enrolled participants.</em>}
    {editable && anyAddedClients && <p><a href={urlBuilder.build('registrationSheet')}>
        Generate sheet of initial registration QR codes
    </a></p>}
    {editable && <form method="POST" action={urlBuilder.build('clients')}>
        <h3>Add new participants</h3>
        <textarea name='participants' placeholder='Enter participant IDs, one per line' rows={6}
                  cols={40} />
        <br />
        <input type="submit" value="Add Participants" />
    </form>}
    <h2>Surveys allocated to this group</h2>
    {oneoffAllocations.length > 0 ? <table>
        <tr><th>Survey</th><th>Notes</th><th>Opens at</th><th>Due at</th><th>Closes at</th><th>Allocated by</th><th>&nbsp;</th></tr>
        {oneoffAllocations.map(allocation => <tr>
            <td>{surveyLink(allocation)}</td>
            <td>{allocation.note}</td>
            <td>{formatDatetime(allocation.openAt)}</td>
            <td>{formatDatetime(allocation.dueAt)}</td>
            <td>{formatDatetime(allocation.closeAt)}</td>
            <td>{allocation.creator.name}</td>
            <td>{surveyResultsLink(allocation)}</td>
        </tr>)}
        <tr>
        </tr>
    </table> : <p>No one-off surveys.</p>}
    {initialAllocation ? <>
      <p>Initial registration survey: {surveyLink(initialAllocation)} — {surveyResultsLink(initialAllocation)}</p>
    </> : <p>No initial registration survey.</p>}
    <h2>Researchers</h2>
    <AdminManagement on={group} permissionName={"GroupPermission"} permissionExplanation={permissionExplanation} />
    </body>)
});

export default GroupView;

const permissionExplanation: PermissionExplanation = (level: AccessLevel) => {
    switch (level) {
        case AccessLevel.view:
            return '(can only view participant answers)';
        case AccessLevel.edit:
            return '(can change participants)';
        case AccessLevel.owner:
            return '(can change participants and researchers)';
    }
};
