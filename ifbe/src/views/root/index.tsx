import * as React from 'react'
import { User } from "../../service/user.service";
import { AdminLevel } from "../../model/admin.model";

interface Props {
    user: User
}

export default function(props: Props) {
    return (<body>
        <h1>Welcome to Inspiring Futures</h1>
        <p>You are logged in as {props.user.name}.</p>
        {props.user.level === AdminLevel.super && <div>
            <hr />
            <h2>Add another user</h2>
            <form method='POST' action='/admin/add'>
                <input name='email' placeholder="Email address" /><br />
                <label><input type='checkbox' name='superuser' value='on' />Make super admin</label><br />
                <input type='submit' value='Add' />
            </form>
        </div>}
    </body>);
}
