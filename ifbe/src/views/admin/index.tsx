import * as React from 'react'
import { Group } from "../../model/group.model";
import { GroupAccessLevel } from "../../model/groupPermission.model";

interface Props {
    groups: Array<Group & {permission: GroupAccessLevel}>
}

export default function({groups}: Props) {
    return (<body>
        <h1>Admin area</h1>
        <h2>Groups</h2>
        <ul>{groups.map(group => <li key={group.id}><a href={'/admin/group/' + group.id}>{group.name}</a></li>)}</ul>
    </body>)
}
