import * as React from 'react'
import { Group } from "../../../model/group.model";
import { useUrlBuilder, wrap } from "../../wrapper";
import { Client, ClientStatus as CS } from '../../../model/client.model';
import { AccessLevel } from "../../../model/accessLevels";

interface Props {
    group: Group & {permission: AccessLevel} & {admins: never};
}

const ClientRow = ({client, group}: {group: Group, client: Client;}) => {
    const urlBuilder = useUrlBuilder();

    const registerLink = urlBuilder.absolute(`/api/client/registration/token/${group.code}/${client.participantID}`);

    return <tr>
        <td>{client.participantID}</td>
        <td><img src={urlBuilder.build('/qr', {url: registerLink})}/></td>
    </tr>;
};

const RegistrationSheetView = wrap(({group}: Props) => {
    const urlBuilder = useUrlBuilder();

    const clients = group.clients;
    clients.sort((a, b) => {
        return a.participantID.localeCompare(b.participantID);
    });
    const addedClients = clients.filter(c => c.status === CS.added);

    return (<body>
        <h1>Group: {group.name}</h1>
        <p>Code: {group.code}</p>
        <h2>Unregistered Participants</h2>
        <table cellPadding={4}>
            <tr>
                <th>Participant ID</th>
                <th>Login QR code</th>
            </tr>
            {addedClients.map(client => <ClientRow key={client.id} client={client} group={group} />)}
        </table>
        <p><a href={urlBuilder.build('/admin/group/' + group.id)}>Go back to the group <em>{group.name}</em></a></p>
    </body>);
});

export default RegistrationSheetView;
