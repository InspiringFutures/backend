import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { Menu, MenuItem } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

interface TypeMenuProps<Type> {
    type: Type;
    setType: (type: Type) => void;
}

export type TypeInfo<Type extends string> = {
    [key in Type]: {
        name: string;
        icon: JSX.Element;
    }
}

export function makeTypeMenu<Type extends string>(typeInfo: TypeInfo<Type>) {
    return function TypeMenu({type, setType}: TypeMenuProps<Type>) {
        const classes = useStyles();

        const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

        const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
            setAnchorEl(event.currentTarget);
        };

        const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, option: Type) => {
            setType(option);
            setAnchorEl(null);
        };

        const handleClose = () => {
            setAnchorEl(null);
        };

        const selected = typeInfo[type];

        return (
            <>
                <List component="nav" className={classes.typeMenu}>
                    <ListItem
                        button
                        aria-haspopup="true"
                        onClick={handleClickListItem}
                        className={classes.typeMenu}
                    >
                        <ListItemIcon>{selected.icon}</ListItemIcon>
                        <ListItemText primary={selected.name}/>
                        <ListItemIcon><ArrowDropDownIcon/></ListItemIcon>
                    </ListItem>
                </List>
                <Menu
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {Object.keys(typeInfo).map((optionAsString, index) => {
                        const option = optionAsString as Type;
                        return (
                            <MenuItem
                                key={option}
                                selected={option === type}
                                onClick={(event) => handleMenuItemClick(event, option)}
                            >
                                <ListItemIcon>{typeInfo[option].icon}</ListItemIcon>
                                {typeInfo[option].name}
                            </MenuItem>
                        );
                    })}
                </Menu>
            </>
        );
    };
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        typeMenu: {
            padding: 0,
        },
    }),
);
