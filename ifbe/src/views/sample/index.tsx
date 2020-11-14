import * as React from 'react'

interface Props {
    index: string
}

export default function(props: Props) {
    return (
        <h1>Index: {props.index}</h1>
    )
}
