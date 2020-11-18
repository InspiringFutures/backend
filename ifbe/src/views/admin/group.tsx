import * as React from 'react'
import { Group } from "../../model/group.model";
import { GroupAccessLevel, GroupAccessLevels } from "../../model/groupPermission.model";
import { useUrlBuilder, wrap } from "../wrapper";


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

const GroupView = wrap(({group}: Props) => {
    const urlBuilder = useUrlBuilder();
    const owner = group.permission === GroupAccessLevel.owner;
    return (<body>
    <h1>Group: {group.name}</h1>
    <p>Code: {group.code}</p>
    {owner && <p>You are an owner of this group.</p>}
    <h2>Participants</h2>
    <ul>{group.clients.map(client => <li key={client.id}>{client.nickName}</li>)}</ul>
    {group.clients.length === 0 && <em>There are currently no enrolled participants.</em>}
    <h2>Researchers</h2>
    <ul>{group.admins.map(admin => <AdminRow key={admin.id} admin={admin} editable={owner} />)}</ul>
    {owner && <form method="POST" action={urlBuilder.build('admins')}>
        <label>Email: <input name="email" placeholder="Email address" /></label><br />
        <PermissionSelector level={GroupAccessLevel.owner}/>
        <input type="submit" value="Add" />
    </form>}
    </body>)
});

export default GroupView;
