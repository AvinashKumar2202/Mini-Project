import PropTypes from 'prop-types';
import { ListSubheader, styled } from '@mui/material';

const NavGroup = ({ item }) => {
  const ListSubheaderStyle = styled((props) => <ListSubheader disableSticky {...props} />)(
    () => ({
      fontWeight: 700,
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginTop: '20px',
      marginBottom: '4px',
      color: 'rgba(255,255,255,0.35)',
      lineHeight: '24px',
      padding: '3px 12px',
      background: 'transparent',
    }),
  );
  return (
    <ListSubheaderStyle>{item.subheader}</ListSubheaderStyle>
  );
};

NavGroup.propTypes = {
  item: PropTypes.object,
};

export default NavGroup;

