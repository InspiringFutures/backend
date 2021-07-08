import * as React from 'react'

import { useUrlBuilder, wrap } from '../wrapper';

import { Group } from "../../model/group.model";
import { Client } from '../../model/client.model';
import { Journal } from '../../model/journal.model';
import { JournalEntry } from '../../model/journalEntry.model';


interface Props {
    group: Group;
    client: Client;
}

const Entry = ({entry, accessStorage}: {entry: Journal, accessStorage: AccessStorage}) => {

    function tagFor(je: JournalEntry) {
        const src = accessStorage(entry.clientId, entry.id, je.id);
        switch (je.type) {
            case 'photo':
                return <a style={{paddingLeft: '5px'}} href={src} target="_blank"><img width={250} key={je.clientEntryId} src={src} /></a>;
            case 'video':
                return <video width={250} key={je.clientEntryId} src={src} controls />;
        }
    }

    switch (entry.type) {
        case "text":
            return <div>{entry.text}</div>;
        case "audio":
            return <div><audio src={accessStorage(entry.clientId, entry.id, entry.entries[0].id)} controls /></div>;
        case "media":
            return <div>
                <div>
                    {entry.entries.map((je) => tagFor(je))}
                </div>
                <div>{entry.text}</div>
            </div>;
    }
};

type AccessStorage = (clientId: number, journalId: number, entryId: number) => string;

export const EntryRow = ({entry, accessStorage}: {accessStorage: AccessStorage, entry: Journal}) => {
    return <div style={{borderBottom: '1px #eee solid', marginBottom: '6px'}}>
        <Entry entry={entry} accessStorage={accessStorage} />
        <div style={{fontSize: 'small', textAlign: 'right'}}>{entry.createdAt.toLocaleString()}</div>
    </div>;
};

const ClientView = wrap(({group, client}: Props) => {
    const urlBuilder = useUrlBuilder();

    function accessStorage(_clientId: number, journalId: number, entryId: number) {
        return urlBuilder.build(`journal/${journalId}/entry/${entryId}/raw`);
    }

    const backButton = '<button onClick="history.back()">Go back</button>';
    return (<body>
    <h1>Client: {client.participantID}</h1>
    <p>In group: {group.name} ({group.code})</p>
    <div><span dangerouslySetInnerHTML={{ __html: backButton }} /></div>
    <h2>Journal</h2>
    {client.journals.reverse().map(entry => <EntryRow key={entry.id} entry={entry} accessStorage={accessStorage} />)}
    </body>)
});

export default ClientView;
