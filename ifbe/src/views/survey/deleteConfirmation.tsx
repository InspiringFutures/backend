import * as React from 'react'

import { useCsrfHiddenField, useUrlBuilder, wrap } from '../wrapper';
import { Group } from "../../model/group.model";
import { Survey } from '../../model/survey.model';

type Props = {survey: Survey};

const DeleteConfirmationView = wrap((props: Props) => {
    const csrfField = useCsrfHiddenField();
    const {survey} = props;

    const backButton = '<button onClick="history.back()">Go back</button>';
    return (<body>
    <h1>Are you sure?</h1>
    <p>Please confirm that you want to delete survey <b>{survey.name}</b> and deallocate it from all groups.</p>
    <span dangerouslySetInnerHTML={{ __html: backButton }} />
    <form method="POST" style={{ display: "inline" }}>
        {csrfField}
        <input type="hidden" name="confirmed" value="true" />
        <input type="submit" value="Confirm" />
    </form>
    </body>);
});

export default DeleteConfirmationView;
