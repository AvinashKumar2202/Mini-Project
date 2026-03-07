import React from 'react';
import { Card, CardContent, Typography, Stack, Box } from '@mui/material';

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}) => {
  return (
    <Card
      sx={{
        padding: 0,
        /* Entrance animation */
        animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
        /* Hover glow border */
        transition: 'box-shadow 0.28s ease, border-color 0.28s ease',
        border: '1px solid transparent',
        '&:hover': {
          boxShadow: '0 0 0 2px rgba(108,99,255,0.35), 0 12px 36px rgba(108,99,255,0.14)',
          borderColor: 'rgba(108,99,255,0.20)',
        },
      }}
      elevation={9}
      variant={undefined}
    >
      {cardheading ? (
        <CardContent>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{ p: '30px' }}>
          {title ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Box>
                {title ? <Typography variant="h5">{title}</Typography> : ''}
                {subtitle ? (
                  <Typography variant="subtitle2" color="textSecondary">
                    {subtitle}
                  </Typography>
                ) : (
                  ''
                )}
              </Box>
              {action}
            </Stack>
          ) : null}

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
