import * as React from 'react'
import { Group } from "../../model/group.model";
import { GroupAccessLevel } from "../../model/groupPermission.model";

interface Props {
    group: Group & {permission: GroupAccessLevel};
    url: string;
}

export default function({group, url}: Props) {
    console.log(group);
    const owner = group.permission === GroupAccessLevel.owner;
    return (<body>
        <h1>Group: {group.name}</h1>
        <p>Code: {group.code}</p>
        {owner && <p>You are an owner of this group.</p>}
        <h2>Participants</h2>
        <ul>{group.clients.map(client => <li key={client.id}>{client.nickName}</li>)}</ul>
        <h2>Researchers</h2>
        <ul>{group.admins.map(admin => <li key={admin.id}>{admin.name || `${admin.email} (not logged in yet)`} – {admin.GroupPermission.level}</li>)}</ul>
        {owner && <form method='POST' action={url + '/admins'}>
            <label>Email: <input name='email' placeholder="Email address" /></label><br />
            <label>Permission: <select name='permission'>
                <option value='view'>Viewer (can only view participant answers)</option>
                <option value='edit'>Editor (can change participants)</option>
                <option selected value='owner'>Owner (can change participants and researchers)</option>
            </select></label><br />
            <input type='submit' value='Add' />
        </form>}
    </body>)
}
