import * as React from 'react'

interface Props {
    msg: string
}

export default function(props: Props) {
    return (
        <h1>{props.msg}</h1>
    )
}
