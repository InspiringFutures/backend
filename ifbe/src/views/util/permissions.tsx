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

export type PermissionExplanation = (level: AccessLevel) => (string);

function PermissionSelector({level, permissionExplanation}: { level: AccessLevel, permissionExplanation: PermissionExplanation }) {
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
    permissionExplanation: PermissionExplanation;
};

const AdminRow = function<P extends string>({admin, editable, permissionName, permissionExplanation}: AdminRowProps<P>) {
    const urlBuilder = useUrlBuilder();
    return <li>
        {admin.name || `${admin.email} (not logged in yet)`}{' – '}
        {editable ?
            <>
                <form style={{display: "inline"}} method="POST"
                      action={urlBuilder.build('admins')}>
                    <input type="hidden" name="email" value={admin.email} />
                    <PermissionSelector level={admin[permissionName].level} permissionExplanation={permissionExplanation}/>
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
    permissionExplanation: PermissionExplanation;
};

export function AdminManagement<P extends string>({on, permissionName, permissionExplanation}: AdminManagementProps<P>) {
    const urlBuilder = useUrlBuilder();

    const owner = on.permission === AccessLevel.owner;
    return <>
        <ul>{on.admins.map(admin => <AdminRow key={admin.id} admin={admin} editable={owner}
                                              permissionName={permissionName} permissionExplanation={permissionExplanation} />)}</ul>
        {owner && <form method="POST" action={urlBuilder.build('admins')}>
            <label>Email: <input name="email" placeholder="Email address"/></label><br/>
            <PermissionSelector level={AccessLevel.owner} permissionExplanation={permissionExplanation} />
            <input type="submit" value="Add"/>
        </form>}
    </>;
}
