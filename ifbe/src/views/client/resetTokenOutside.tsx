import * as React from 'react'

import { useUrlBuilder, wrap } from "../wrapper";

interface Props {
    resetURL: string;
}

const ResetTokenOutsideView = wrap(({resetURL}: Props) => {
    const urlBuilder = useUrlBuilder();

    return (<body>
        <h1>Inspiring Futures</h1>
        <p>You can reset your access by accessing this link on your device:</p>
        <a href={resetURL}>{resetURL}</a>
        <p>Or scan this QR code with the Inspiring Futures app</p>
        <img src={urlBuilder.build('/qr', {url: resetURL})} />
    </body>);
});

export default ResetTokenOutsideView;
