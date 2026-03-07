import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Peer } from 'peerjs';
import { Box, Typography, Stack, Chip, GlobalStyles, Button } from '@mui/material';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

/**
 * MobileCamPage
 * Route: /mobile-cam/:sessionId  (sessionId = desktop's PeerJS peer ID)
 *
 * Fixes:
 * - No custom peer ID for mobile either (avoids "Invalid token").
 * - Connection detected via iceConnectionState, not 'stream' event
 *   (stream may not fire when desktop answers with no local stream).
 * - Added TURN servers for cross-subnet / mobile-data connections.
 */
export default function MobileCamPage() {
    const { sessionId } = useParams();
    const videoRef = useRef(null);
    const [status, setStatus] = useState('');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);

    let peerInstance = useRef(null);
    let streamInstance = useRef(null);

    const startCameraAndConnect = async () => {
        setError('');
        setStatus('Initializing camera…');

        try {
            // Fail fast if secure context is missing
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Camera unsupported here. Please open this link in Chrome/Safari, not an in-app browser or QR scanner. (Ensure URL is HTTPS).');
                setStatus('');
                return;
            }

            let stream;
            try {
                // 1. Try rear camera explicitly
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                });
            } catch (err) {
                // Fallback to any camera if environment camera is not available
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            }

            streamInstance.current = stream;
            setIsCameraActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setStatus('Connecting to exam desktop…');

            // 2. Create mobile peer
            const peer = new Peer({
                host: window.location.hostname,
                port: window.location.port,
                path: '/peerjs',
                secure: window.location.protocol.includes('https'),
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        // TURN for cross-subnet (e.g. phone on mobile data, PC on WiFi)
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject',
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject',
                        },
                    ],
                },
            });

            peerInstance.current = peer;

            peer.on('open', () => {
                // 3. Call the desktop peer (sessionId = desktop's PeerJS auto-assigned ID)
                const call = peer.call(sessionId, stream);

                if (!call) {
                    setError('Could not reach desktop. Make sure the exam page is open and try again.');
                    return;
                }

                // ── Primary: stream event (fires if desktop sends any stream back)
                call.on('stream', () => {
                    setConnected(true);
                    setStatus('🔴 Recording — Room Monitoring Active');
                });

                // ── Fallback: ICE state (reliable even when no stream comes back)
                const onIceChange = () => {
                    const state = call.peerConnection?.iceConnectionState;
                    if (state === 'connected' || state === 'completed') {
                        setConnected(true);
                        setStatus('🔴 Recording — Room Monitoring Active');
                    } else if (state === 'failed') {
                        setError('Connection failed. Please refresh and try again.');
                    } else if (state === 'disconnected' || state === 'closed') {
                        setConnected(false);
                        setStatus('Disconnected. Exam may have ended.');
                    }
                };

                if (call.peerConnection) {
                    call.peerConnection.addEventListener('iceconnectionstatechange', onIceChange);
                } else {
                    // fallback if peerConnection not ready immediately
                    call.on('iceStateChanged', (state) => {
                        if (state === 'connected' || state === 'completed') {
                            setConnected(true);
                            setStatus('🔴 Recording — Room Monitoring Active');
                        } else if (state === 'failed') {
                            setError('Connection failed. Please refresh and try again.');
                        } else if (state === 'disconnected' || state === 'closed') {
                            setConnected(false);
                            setStatus('Disconnected. Exam may have ended.');
                        }
                    });
                }

                call.on('error', (err) => {
                    setError('Connection error. Please refresh and try again.');
                    console.error(err);
                });

                call.on('close', () => {
                    setConnected(false);
                    setStatus('Disconnected. Exam may have ended.');
                });
            });

            peer.on('error', (err) => {
                if (err.type === 'peer-unavailable') {
                    setError('Desktop not ready yet. Please wait a moment and refresh.');
                } else {
                    setError(`Connection error (${err.type}). Please refresh.`);
                }
            });
        } catch (err) {
            console.error('Mobile camera error:', err);
            setStatus('');
            setIsCameraActive(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera access denied. Please allow camera permission in your browser settings and try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device. Please use a device with a camera.');
            } else if (err.name === 'NotReadableError') {
                setError('Camera is already in use by another application. Close it and try again.');
            } else {
                setError(`Could not access camera (${err.message}). Try clicking "Start Camera".`);
            }
        }
    };

    useEffect(() => {
        // Do NOT auto-start on mount. Mobile browsers (especially iOS Safari and in-app scanners) 
        // often block or ignore getUserMedia if it's not triggered by a direct user gesture (button click).

        return () => {
            if (streamInstance.current) {
                streamInstance.current.getTracks().forEach((t) => t.stop());
            }
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }
        };
    }, [sessionId]);

    return (
        <>
            <GlobalStyles
                styles={{
                    body: { margin: 0, background: '#0a0a14', color: '#fff', fontFamily: 'Inter, sans-serif' },
                }}
            />
            <Box
                sx={{
                    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', p: 2,
                    background: 'linear-gradient(135deg, #0a0a14 0%, #12122a 100%)',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <VideocamRoundedIcon sx={{ color: '#6C63FF', fontSize: 32 }} />
                    <Typography variant="h5" fontWeight={800} color="#fff">
                        SAAN <span style={{ color: '#6C63FF' }}>Third Eye</span>
                    </Typography>
                </Stack>

                <Box
                    sx={{
                        position: 'relative', width: '100%', maxWidth: 420,
                        borderRadius: '20px', overflow: 'hidden',
                        border: `2px solid ${connected ? 'rgba(0,212,170,0.5)' : 'rgba(108,99,255,0.4)'}`,
                        boxShadow: connected ? '0 0 30px rgba(0,212,170,0.25)' : '0 0 30px rgba(108,99,255,0.2)',
                        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay playsInline muted
                        style={{ width: '100%', minHeight: '240px', objectFit: 'cover', display: 'block', background: '#0a0a14' }}
                    />
                    {connected && (
                        <Box
                            sx={{
                                position: 'absolute', top: 12, left: 12,
                                bgcolor: 'rgba(0,0,0,0.7)', borderRadius: '20px',
                                px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.8,
                            }}
                        >
                            <FiberManualRecordIcon sx={{ color: '#ff4444', fontSize: 12, animation: 'pulseGlow 1.5s ease-in-out infinite' }} />
                            <Typography variant="caption" color="#fff" fontWeight={700} fontSize="0.7rem">REC</Typography>
                        </Box>
                    )}
                </Box>

                <Box mt={3} textAlign="center" display="flex" flexDirection="column" alignItems="center" gap={2}>
                    {error && (
                        <Chip label={error} sx={{ bgcolor: 'rgba(255,80,80,0.15)', color: '#ff8080', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '12px', maxWidth: 340, height: 'auto', py: 1, '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'center', fontSize: '0.8rem' } }} />
                    )}

                    {!isCameraActive && (
                        <Button
                            variant="contained"
                            onClick={startCameraAndConnect}
                            size="large"
                            sx={{
                                background: 'linear-gradient(135deg,#6C63FF,#00D4AA)',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                px: 5, py: 1.5,
                                boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
                                '&:hover': { background: 'linear-gradient(135deg,#5a52e0,#00b894)' },
                            }}
                        >
                            Start Camera
                        </Button>
                    )}

                    {!error && status && (
                        <Chip label={status} sx={{ bgcolor: connected ? 'rgba(0,212,170,0.12)' : 'rgba(108,99,255,0.12)', color: connected ? '#00D4AA' : '#a89fff', border: `1px solid ${connected ? 'rgba(0,212,170,0.3)' : 'rgba(108,99,255,0.3)'}`, borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }} />
                    )}
                </Box>

                {!isCameraActive && (
                    <Typography variant="body2" color="#ffb300" mt={3} textAlign="center" sx={{ maxWidth: 300, bgcolor: 'rgba(255,179,0,0.1)', p: 1.5, borderRadius: '12px', border: '1px solid rgba(255,179,0,0.3)' }}>
                        If you are using a QR Scanner app and nothing happens, tap the top-right menu and choose <strong>Open in Browser (Chrome/Safari)</strong>.
                    </Typography>
                )}

                <Typography variant="caption" color="rgba(255,255,255,0.3)" mt={2} textAlign="center">
                    Keep this page open and your phone pointed at the room during the exam.
                    <br />Do not lock your screen.
                </Typography>
            </Box >
        </>
    );
}
