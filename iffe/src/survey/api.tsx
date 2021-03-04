import { SurveyContent } from "./SurveyContent";

export function extractErrorMessage(e: Error | any) {
    return 'message' in e ? e.message : e.toString();
}

export const endpoint = `http://localhost:8115`;

export interface SurveySummary {
    id: number;
    name: string;
}

export interface SurveyInfo {
    id: number;
    name: string;
    updatedAt: Date;
    updatedBy: string;
    content: SurveyContent[];
}

export function loadSurvey(surveyId: number | string | undefined, setContent: (value: SurveyInfo) => void, setError: (value: string) => void) {
    if (surveyId === undefined) {
        setError("No survey ID provided");
        return;
    }
    fetch(`${endpoint}/survey/${surveyId}/content`)
        .then(c => {
            return c.json();
        })
        .then(json => {
            const surveyInfo = json as SurveyInfo;
            if (surveyInfo.name !== undefined && surveyInfo.content !== undefined) {
                setContent(surveyInfo);
            } else {
                throw new Error("Network issue");
            }
        })
        .catch(e => {
            setError(extractErrorMessage(e));
        });
}

export const saveSurvey = async (surveyId: number | string | undefined, content: SurveyContent[], autoSave: boolean) => {
    try {
        const result = await fetch(`${endpoint}/survey/${surveyId}/content`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({content, autoSave}),
        });
        const json = await result.json();
        return json as { success: boolean; message: string };
    } catch (e) {
        return {success: false, message: "Error saving: " + extractErrorMessage(e)};
    }
};

export function loadSurveys(surveyId: number, setSurveys: (value: SurveySummary[]) => void, setError: (value: string) => void) {
    fetch(`${endpoint}/survey/list`)
        .then(c => {
            if (!c.ok) {
                throw new Error("Failed to load surveys");
            }
            return c.json();
        })
        .then(json => {
            const surveyInfo = json as SurveySummary[];
            if (surveyInfo.some(survey => survey.id !== surveyId)) {
                setSurveys(surveyInfo);
            } else {
                throw new Error("You have no other surveys");
            }
        })
        .catch(e => {
            setError(extractErrorMessage(e));
        });
}
