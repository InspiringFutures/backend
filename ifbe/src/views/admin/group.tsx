import * as React from 'react'
import { Group } from "../../model/group.model";
import { GroupAccessLevel, GroupAccessLevels } from "../../model/groupPermission.model";
import { useUrlBuilder, wrap } from "../wrapper";
import { Client, ClientStatus as CS } from '../../model/client.model';


interface Props {
    group: Group & {permission: GroupAccessLevel};
}

function permissionName(level: GroupAccessLevel) {
    switch(level) {
        case GroupAccessLevel.view:
            return 'Viewer';
        case GroupAccessLevel.edit:
            return 'Editor';
        case GroupAccessLevel.owner:
            return 'Owner';
    }
}

function permissionExplanation(level: GroupAccessLevel) {
    switch(level) {
        case GroupAccessLevel.view:
            return '(can only view participant answers)';
        case GroupAccessLevel.edit:
            return '(can change participants)';
        case GroupAccessLevel.owner:
            return '(can change participants and researchers)';
    }
}

function PermissionSelector({level}: {level: GroupAccessLevel}) {
    return <label>Permission: <select name="permission">
        {GroupAccessLevels.map(l => (
            <option key={l} selected={level === l} value={l}>{permissionName(l)} {permissionExplanation(l)}</option>
        ))}
    </select></label>;
}

const AdminRow = ({admin, editable}) => {
    const urlBuilder = useUrlBuilder();
    return <li>
        {admin.name || `${admin.email} (not logged in yet)`}{' – '}
        {editable ?
            <form style={{display: "inline"}} method="POST"
                  action={urlBuilder.build('admin/' + admin.id)}>
                <PermissionSelector level={admin.GroupPermission.level} />
                <input type="submit" value="Update"/>
            </form>
        : permissionName(admin.GroupPermission.level)}
    </li>;
};

const ClientRow = ({client, editable}: {client: Client; editable: boolean}) => {
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
        <td>{client.participantID}</td>
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

const GroupView = wrap(({group}: Props) => {
    const urlBuilder = useUrlBuilder();
    const owner = group.permission === GroupAccessLevel.owner;
    const editable = group.permission !== GroupAccessLevel.view;

    const clients = group.clients;
    clients.sort((a, b) => {
        return a.participantID.localeCompare(b.participantID);
    });

    return (<body>
    <h1>Group: {group.name}</h1>
    <p>Code: {group.code}</p>
    {owner && <p>You are an owner of this group.</p>}
    <h2>Participants</h2>
    <table>
        <tr><th>Participant ID</th><th>Status</th><th colSpan={2} /></tr>
        {clients.map(client => <ClientRow key={client.id} client={client} editable={editable} />)}
    </table>
    {clients.length === 0 && <em>There are currently no enrolled participants.</em>}
    {editable && <form method="POST" action={urlBuilder.build('clients')}>
        <h3>Add new participants</h3>
        <textarea name='participants' placeholder='Enter participant IDs, one per line' rows={6} cols={40}/>
        <br />
        <input type="submit" value="Add Participants" />
    </form>}
    <h2>Researchers</h2>
    <ul>{group.admins.map(admin => <AdminRow key={admin.id} admin={admin} editable={owner} />)}</ul>
    {owner && <form method="POST" action={urlBuilder.build('admins')}>
        <label>Email: <input name="email" placeholder="Email address" /></label><br />
        <PermissionSelector level={GroupAccessLevel.view}/>
        <input type="submit" value="Add" />
    </form>}
    </body>)
});

export default GroupView;
