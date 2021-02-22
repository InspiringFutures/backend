import React from "react";

export function Spacer({width}: { width?: number }) {
    return <span style={width ? {width} : {flexGrow: 1}}/>;
}
