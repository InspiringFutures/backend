import { Content } from "./SurveyContent";
import { useCallback, useRef, useState } from "react";

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

const timeoutClearer = (currentTimeout: ReturnType<typeof setTimeout> | undefined) => {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }
    return undefined;
};
export const useTriggeredTimer = (callback: () => void): [() => void, () => void, () => void] => {
    const [, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();
    const storedCallback = useRef(callback);
    storedCallback.current = callback;

    return [
        useCallback(
            () => setTimeoutId((currentTimeout) => {
                if (currentTimeout !== undefined) {
                    return currentTimeout;
                } else {
                    return setTimeout(() => {
                        setTimeoutId(undefined);
                        storedCallback.current();
                    }, 1000 * 5 * 60); // Every 5 minutes
                }
            }),
            [storedCallback]
        ),
        useCallback(() => {
            setTimeoutId(timeoutClearer);
        }, []),
        useCallback(() => {
            setTimeoutId(currentTimeout => {
                if (currentTimeout !== undefined) {
                    storedCallback.current();
                }
                return timeoutClearer(currentTimeout);
            });
        }, [storedCallback])
    ];
}
