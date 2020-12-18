import * as React from 'react'

import { useUrlBuilder, wrap } from "../wrapper";
import { Group } from "../../model/group.model";

type Props =
  | {participantID: string; confirmationNeeded: true}
  | {confirmationNeeded: false; participantID: string; group: Group; resetToken: { code: string; expiresAt: Date }};

const ResetView = wrap((props: Props) => {
    const urlBuilder = useUrlBuilder();

    const {participantID} = props;

    if (props.confirmationNeeded === true) {
        const backButton = '<button onClick="() => history.back();">Go back</button>';
        return (<body>
        <h1>Are you sure?</h1>
        <p>Please confirm that {participantID} has lost access to their device.</p>
        <span dangerouslySetInnerHTML={{ __html: backButton }} />
        <form method="POST" style={{ display: "inline" }}>
            <input type="hidden" name="confirmed" value="true" />
            <input type="submit" value="Confirm" />
        </form>
        </body>);
    } else {
        const {group, resetToken} = props;
        const resetURL = urlBuilder.absolute('/api/client/reset/token/' + resetToken.code);
        return (<body>
            <h1>Reset generated</h1>
            <p>You have reset access for <em>{participantID}</em> in group <em>{group.name}</em>.</p>
            <p>They can access their journal again by entering the code: {resetToken.code}</p>
            <p>
                Or send them this link which they must access on their phone:<br />
                <a href={resetURL}>{resetURL}</a>
            </p>
            <p>
                Or they should scan this QR Code with the app:<br />
                <img src={urlBuilder.build('/qr', {url: resetURL})} />
            </p>
            <p><strong>They must use this reset by {resetToken.expiresAt.toLocaleString()}.</strong></p>
            <p><strong>This is the only time this reset will be shown.</strong></p>
            <p><a href={urlBuilder.build('/admin/group/' + group.id)}>Go back to the group <em>{group.name}</em></a></p>
        </body>);
    }
});

export default ResetView;
