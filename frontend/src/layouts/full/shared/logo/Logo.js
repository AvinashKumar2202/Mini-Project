import { Link } from 'react-router-dom';
import { styled, Box, Typography } from '@mui/material';
import logoImg from 'src/assets/images/logos/saan-logo.svg';

const LinkStyled = styled(Link)(() => ({
  height: '70px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
}));

const Logo = () => {
  return (
    <LinkStyled to="/">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
        }}
      >
        {/* Logo image */}
        <Box
          component="img"
          src={logoImg}
          alt="ExamPortal Logo"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            flexShrink: 0,
          }}
        />
        {/* Wordmark: SAAN AI */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: '1.15rem',
              color: '#8B7CF8',
              letterSpacing: '0.14em',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            SAAN
          </Typography>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: '1.15rem',
              background: 'linear-gradient(135deg, #A78BFA 0%, #00D4AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.08em',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            AI
          </Typography>
        </Box>
      </Box>
    </LinkStyled>
  );
};

export default Logo;


