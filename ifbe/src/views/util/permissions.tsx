import * as React from "react";
import { AccessLevel, AccessLevels } from "../../model/accessLevels";
import { useUrlBuilder } from "../wrapper";

function nameForPermission(level: AccessLevel) {
    switch (level) {
        case AccessLevel.view:
            return 'Viewer';
        case AccessLevel.edit:
            return 'Editor';
        case AccessLevel.owner:
            return 'Owner';
    }
}

function permissionExplanation(level: AccessLevel) {
    switch (level) {
        case AccessLevel.view:
            return '(can only view participant answers)';
        case AccessLevel.edit:
            return '(can change participants)';
        case AccessLevel.owner:
            return '(can change participants and researchers)';
    }
}

export function PermissionSelector({level}: { level: AccessLevel }) {
    return <label>Permission: <select name="permission">
        {AccessLevels.map(l => (
            <option key={l} selected={level === l}
                    value={l}>{nameForPermission(l)} {permissionExplanation(l)}</option>
        ))}
    </select></label>;
}

type Admin<P extends string> =
    { id?: string; name?: string; email: string; }
    & { [key in P]: { level: AccessLevel } };

type AdminRowProps<P extends string> = {
    admin: Admin<P>
    editable: boolean;
    permissionName: P;
};

export const AdminRow = function<P extends string>({admin, editable, permissionName}: AdminRowProps<P>) {
    const urlBuilder = useUrlBuilder();
    return <li>
        {admin.name || `${admin.email} (not logged in yet)`}{' – '}
        {editable ?
            <>
                <form style={{display: "inline"}} method="POST"
                      action={urlBuilder.build('admins')}>
                    <input type="hidden" name="email" value={admin.email} />
                    <PermissionSelector level={admin[permissionName].level}/>
                    <input type="submit" value="Update"/>
                </form>
                <form style={{display: "inline"}} method="POST"
                      action={urlBuilder.build('admins')}>
                    <input type="hidden" name="email" value={admin.email} />
                    <input type="submit" value="Delete"/>
                </form>
            </>
            : nameForPermission(admin[permissionName].level)}
    </li>;
};
type AdminManagementProps<P extends string> = {
    on: { permission: AccessLevel; admins: Admin<P>[] };
    permissionName: P;
};

export function AdminManagement<P extends string>({on, permissionName}: AdminManagementProps<P>) {
    const urlBuilder = useUrlBuilder();

    const owner = on.permission === AccessLevel.owner;
    return <>
        <ul>{on.admins.map(admin => <AdminRow key={admin.id} admin={admin} editable={owner}
                                              permissionName={permissionName}/>)}</ul>
        {owner && <form method="POST" action={urlBuilder.build('admins')}>
            <label>Email: <input name="email" placeholder="Email address"/></label><br/>
            <PermissionSelector level={AccessLevel.owner}/>
            <input type="submit" value="Add"/>
        </form>}
    </>;
}
