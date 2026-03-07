import { useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';

/**
 * useThirdEye  (desktop side)
 *
 * Fixes applied:
 * 1. No custom peer ID (avoids "Invalid token").
 * 2. call.answer(null) replaced with call.answer() — some PeerJS builds
 *    handle null differently. We also listen to iceConnectionState directly
 *    so mobile connection is detected even if 'stream' event doesn't fire.
 * 3. Expose mobileConnected = true as soon as ICE is 'connected'/'completed'.
 */
const useThirdEye = () => {
    const [desktopPeerId, setDesktopPeerId] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [mobileConnected, setMobileConnected] = useState(false);
    const peerRef = useRef(null);

    useEffect(() => {
        const peer = new Peer({
            host: window.location.hostname,
            port: window.location.port,
            path: '/peerjs', // Proxy will pass this to the backend
            secure: window.location.protocol.includes('https'),
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    // Free TURN server for when STUN fails (different subnets/NAT)
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

        peerRef.current = peer;

        peer.on('open', (id) => {
            setDesktopPeerId(id);
        });

        peer.on('call', (call) => {
            // Answer without a local stream — we only want to receive
            call.answer();

            // ── Primary: stream event ──────────────────────────────────────
            call.on('stream', (stream) => {
                if (stream && stream.active) {
                    setRemoteStream(stream);
                    setMobileConnected(true);
                }
            });

            // ── Fallback: watch ICE connection state directly ──────────────
            // This fires even when 'stream' doesn't (e.g. when mobile sends
            // video but desktop answers with no stream back).
            const onIceChange = () => {
                const state = call.peerConnection?.iceConnectionState;
                if (state === 'connected' || state === 'completed') {
                    setMobileConnected(true);
                    // Get the remote stream from the RTCPeerConnection tracks
                    const receivers = call.peerConnection?.getReceivers() || [];
                    const tracks = receivers.map((r) => r.track).filter(Boolean);
                    if (tracks.length > 0) {
                        setRemoteStream(new MediaStream(tracks));
                    }
                } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                    setMobileConnected(false);
                    setRemoteStream(null);
                }
            };

            if (call.peerConnection) {
                call.peerConnection.addEventListener('iceconnectionstatechange', onIceChange);
            } else {
                // peerConnection may not exist yet; wait for it
                call.on('iceStateChanged', (state) => {
                    if (state === 'connected' || state === 'completed') {
                        setMobileConnected(true);
                    } else if (state === 'failed' || state === 'closed') {
                        setMobileConnected(false);
                        setRemoteStream(null);
                    }
                });
            }

            call.on('close', () => {
                setMobileConnected(false);
                setRemoteStream(null);
            });

            call.on('error', (err) => {
                console.error('ThirdEye call error:', err);
            });
        });

        peer.on('error', (err) => {
            console.warn('ThirdEye peer error:', err.type, err.message);
        });

        return () => {
            peer.destroy();
        };
    }, []);

    return { desktopPeerId, remoteStream, mobileConnected };
};

export default useThirdEye;
