import React, { forwardRef } from 'react';
import { Box, Typography, Stack, Avatar } from '@mui/material';
import { IconAward } from '@tabler/icons-react';

const Certificate = forwardRef(({ studentName, examName, percentage, date }, ref) => {
    return (
        <Box
            ref={ref}
            sx={{
                width: '800px',
                height: '600px',
                padding: '40px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '15px solid #6C63FF',
                boxSizing: 'border-box',
                // Keep it off-screen but in DOM for html2canvas
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
            }}
        >
            {/* Inner Border */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '25px',
                    left: '25px',
                    right: '25px',
                    bottom: '25px',
                    border: '2px solid #A78BFA',
                    zIndex: 0,
                }}
            />

            {/* Corner decorations */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, background: 'linear-gradient(135deg, #6C63FF, #A78BFA)', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(225deg, #6C63FF, #A78BFA)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 80, height: 80, background: 'linear-gradient(45deg, #6C63FF, #A78BFA)', clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} />
            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(315deg, #6C63FF, #A78BFA)', clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }} />

            <Box sx={{ zIndex: 1, textAlign: 'center', width: '100%' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#6C63FF', margin: '0 auto', mb: 3 }}>
                    <IconAward size={48} color="#fff" />
                </Avatar>

                <Typography variant="h2" fontWeight={800} color="#302B63" gutterBottom sx={{ letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Certificate of Achievement
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ fontStyle: 'italic', mb: 4 }}>
                    This is proudly presented to
                </Typography>

                <Typography variant="h3" fontWeight={700} color="#6C63FF" gutterBottom sx={{ borderBottom: '2px solid #00D4AA', display: 'inline-block', paddingBottom: '8px', minWidth: '400px', mb: 4 }}>
                    {studentName}
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    For successfully completing the exam
                </Typography>

                <Typography variant="h4" fontWeight={700} color="#302B63" sx={{ mb: 4 }}>
                    "{examName}"
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
                    With a score of <strong>{percentage}%</strong>
                </Typography>

                <Stack direction="row" justifyContent="space-between" sx={{ width: '80%', margin: '0 auto', mt: 4 }}>
                    <Box sx={{ textAlign: 'center', width: '200px' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 1 }}>{date}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Date</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', width: '200px' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 1, fontFamily: 'cursive', color: '#6C63FF' }}>SAAN AI</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Platform</Typography>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
});

export default Certificate;
