import { Content } from "./SurveyContent";

export function getCountUnder(content: Content[], index: number) {
    const item = content[index];
    if (item.type === 'SectionHeader') {
        // Count questions under this
        let i;
        for (i = index + 1; i < content.length; i++) {
            if (content[i].type === 'SectionHeader') {
                break;
            }
        }
        return i - index;
    }
    return 1;
}
