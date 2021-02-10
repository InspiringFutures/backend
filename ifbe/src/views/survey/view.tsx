import * as React from 'react'
import { Survey } from "../../model/survey.model";
import { useUrlBuilder, wrap } from "../wrapper";
import { AccessLevel } from "../../model/accessLevels";
import { AdminManagement } from "../util/permissions";


interface Props {
    survey: Survey & {permission: AccessLevel};
}

const SurveyView = wrap(({survey}: Props) => {
    const urlBuilder = useUrlBuilder();
    const owner = survey.permission === AccessLevel.owner;
    const editable = survey.permission !== AccessLevel.view;

    return (<body>
    <h1>Survey: {survey.name}</h1>
    {owner && <p>You are an owner of this survey.</p>}
    <p>Last modified by {survey.updater.name} at {survey.updatedAt.toLocaleString()}.</p>
    {editable && <p><a href={urlBuilder.build('edit')}>Edit survey</a></p>}

    <h2>Other survey users</h2>
    <AdminManagement on={survey} permissionName="SurveyPermission"/>
    </body>)
});

export default SurveyView;
