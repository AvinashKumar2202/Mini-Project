import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
} from '@mui/material';

const NavItem = ({ item, level, pathDirect, onClick }) => {
  const Icon = item.icon;
  const itemIcon = <Icon stroke={1.5} size="1.3rem" />;

  const ListItemStyled = styled(ListItem)(() => ({
    whiteSpace: 'nowrap',
    marginBottom: '4px',
    padding: '9px 12px',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.65)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.95)',
    },
    '&.Mui-selected': {
      background: 'linear-gradient(135deg, #6C63FF 0%, #4B44CC 100%)',
      color: '#fff',
      boxShadow: '0 0 18px rgba(108,99,255,0.45)',
      '&:hover': {
        background: 'linear-gradient(135deg, #7D75FF 0%, #5D56DD 100%)',
        color: '#fff',
      },
    },
  }));

  return (
    <List component="li" disablePadding key={item.id}>
      <ListItemStyled
        button
        component={item.external ? 'a' : NavLink}
        to={item.href}
        href={item.external ? item.href : ''}
        disabled={item.disabled}
        selected={pathDirect === item.href}
        target={item.external ? '_blank' : ''}
        onClick={onClick}
      >
        <ListItemIcon
          sx={{
            minWidth: '36px',
            p: '3px 0',
            color: 'inherit',
          }}
        >
          {itemIcon}
        </ListItemIcon>
        <ListItemText
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {item.title}
        </ListItemText>
      </ListItemStyled>
    </List>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  pathDirect: PropTypes.any,
};

export default NavItem;

