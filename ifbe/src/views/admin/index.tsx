import * as React from 'react'
import { Group } from "../../model/group.model";
import { Admin, AdminLevel } from "../../model/admin.model";
import { Survey } from "../../model/survey.model";
import { AccessLevel } from "../../model/accessLevels";
import { useCsrfHiddenField, wrap } from '../wrapper';

interface Props {
    groups: Array<Group & {permission: AccessLevel}>;
    surveys: Array<Survey & {permission: AccessLevel}>;
    user: Admin;
}

export default wrap(({ groups, user, surveys }: Props) => {
    const csrfField = useCsrfHiddenField();
    return (<body>
    <h1>Welcome to Inspiring Futures</h1>
    <p>You are logged in as {user.name}. <form method="POST" action="/login/out"><input type="submit" value="Logout" /></form></p>
    <h2>Groups</h2>
    <ul>{groups.map(group => <li key={group.id}><a
        href={'/admin/group/' + group.id}>{group.name}</a>
    </li>)}</ul>
    <div>
        <hr />
        <h2>Add a new group</h2>
        <form method='POST' action='/admin/group'>
            {csrfField}
            <input name='name' placeholder='Group name' /><br />
            <input name='code' placeholder='Group code (for clients to join this group)'
                   autoCapitalize='characters' pattern='[A-Z]*' /><br />
            <input type='submit' value='Add' />
        </form>
    </div>
    <h2>Surveys</h2>
    <ul>{surveys.map(survey => <li key={survey.id}><a
        href={'/survey/' + survey.id}>{survey.name}</a>
    </li>)}</ul>
    <div>
        <hr />
        <h2>Design a new survey</h2>
        <form method='POST' action='/survey'>
            {csrfField}
            <input name='surveyName' placeholder='Survey name' /><br />
            <input type='submit' value='Add' />
        </form>
    </div>
    {user.level === AdminLevel.super && <div>
      <hr />
      <h2>Add another researcher</h2>
      <form method='POST' action='/admin/add'>
          {csrfField}
        <input name='email' placeholder='Email address' /><br />
        <label><input type='checkbox' name='superuser' value='on' />Make super admin (able to invite
          other researchers and modify any group)</label><br />
        <input type='submit' value='Add' />
      </form>
    </div>}

    </body>);
})
