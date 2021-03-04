import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import Menu from '@material-ui/core/Menu';
import { MenuProps } from "@material-ui/core/Menu/Menu";
import { MenuItem } from "@material-ui/core";

export interface PopupMenuRef {
    open: (on: Element) => void;
}

type PopupMenuProps = Omit<MenuProps, 'open'>;

export const PopupMenu = forwardRef<PopupMenuRef, PopupMenuProps>(({children, ...rest}, ref) => {
    const [anchorEl, setAnchorEl] = React.useState<null | Element>(null);

    useImperativeHandle<PopupMenuRef, PopupMenuRef>(ref, () => {
        return {
            open: (on: Element) => {
                setAnchorEl(on);
            },
        };
    });

    const handleClose = () => {
        setAnchorEl(null);
    };

    return <Menu anchorEl={anchorEl}
                 keepMounted
                 open={Boolean(anchorEl)}
                 onClose={handleClose}
                 {...rest}>
        {children && React.Children.map(children, child => (
            React.isValidElement(child) ?
                React.cloneElement(child, {onClick: () => {
                    if (child.props.onClick) {
                        child.props.onClick();
                    }
                    handleClose();
                }})
            :
                child
        ))}
    </Menu>;
});

export function usePopupMenu(options: { [name: string]: () => void }) {
    const menu = useRef<PopupMenuRef>(null);

    return {
        provided: <PopupMenu ref={menu}>
            {Object.keys(options).map(name => <MenuItem key={name}
                                                        onClick={options[name]}>{name}</MenuItem>)}
        </PopupMenu>,
        open: (e: React.MouseEvent) => menu.current && menu.current.open(e.currentTarget),
    };
}
