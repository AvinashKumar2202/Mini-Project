import React from 'react';
import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

/**
 * SkeletonCard — placeholder shown while data is loading.
 * Usage: <SkeletonCard /> or <SkeletonCard count={4} />
 */
const SingleSkeletonCard = () => (
    <Card sx={{ borderRadius: '16px', overflow: 'hidden' }} elevation={3}>
        <Box sx={{ height: '4px', background: 'linear-gradient(90deg,#e0e0e0,#f5f5f5,#e0e0e0)', backgroundSize: '200% 100%', animation: 'shimmerBg 1.5s linear infinite' }} />
        <CardContent>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '10px', mb: 1.5 }} />
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="text" width="40%" height={20} />
            <Box display="flex" gap={1} mt={1.5}>
                <Skeleton variant="rounded" width={60} height={22} />
                <Skeleton variant="rounded" width={80} height={22} />
            </Box>
        </CardContent>
    </Card>
);

const SkeletonCard = ({ count = 1 }) => {
    if (count === 1) return <SingleSkeletonCard />;
    return (
        <Grid container spacing={3}>
            {Array.from({ length: count }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                    <SingleSkeletonCard />
                </Grid>
            ))}
        </Grid>
    );
};

export default SkeletonCard;
