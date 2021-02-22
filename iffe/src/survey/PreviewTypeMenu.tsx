import React from "react";

import SmartphoneIcon from "@material-ui/icons/Smartphone";
import TabletIcon from "@material-ui/icons/Tablet";

import { makeTypeMenu } from "./TypeMenu";

export const PreviewTypeInfo = {
    mobile: {icon: <SmartphoneIcon/>, name: "Mobile"},
    tablet: {icon: <TabletIcon/>, name: "Tablet"},
};
export const PreviewTypeMenu = makeTypeMenu(PreviewTypeInfo);
