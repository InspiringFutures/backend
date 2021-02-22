import React from "react";

export interface InjectedDialogProps {
    isOpen: boolean;

    open(): void;

    close(): void;
}

interface MakeDialogProps {
    children(props: InjectedDialogProps): JSX.Element;
}

interface MakeDialogState {
    isOpen: boolean;
}

export class MakeDialog extends React.Component<MakeDialogProps, MakeDialogState> {
    state: MakeDialogState = {
        isOpen: false,
    };

    open = () => {
        this.setState({isOpen: true});
    };

    close = () => {
        this.setState({isOpen: false});
    };

    render() {
        return this.props.children({
            isOpen: this.state.isOpen,
            open: this.open,
            close: this.close,
        });
    }
}
