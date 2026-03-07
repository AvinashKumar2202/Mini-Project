import React, { useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { toast } from 'react-toastify';

/**
 * RoomProctor
 *
 * Hidden component that runs COCO-SSD person detection on the
 * remote mobile camera stream every 2 seconds.
 *
 * Props:
 *   remoteStream    – MediaStream from the mobile camera via WebRTC
 *   updateCheatingLog – state setter from TestPage (same signature as WebCam uses)
 */
const RoomProctor = ({ remoteStream, updateCheatingLog }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const modelRef = useRef(null);
    const lastAlertRef = useRef(0); // throttle toast spam

    const detect = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !modelRef.current) return;
        if (video.readyState < 4) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            const objs = await modelRef.current.detect(canvas);
            const people = objs.filter((o) => o.class === 'person');

            if (people.length > 1) {
                // Throttle: max one alert every 10 s
                const now = Date.now();
                if (now - lastAlertRef.current > 10000) {
                    lastAlertRef.current = now;
                    updateCheatingLog((prev) => ({
                        ...prev,
                        multipleFaceCount: prev.multipleFaceCount + 1,
                    }));
                    toast.warn(`⚠️ Extra Person Detected in Room (${people.length} people seen)`, {
                        toastId: 'room-person',
                        autoClose: 5000,
                    });
                }
            }
        } catch (err) {
            console.warn('RoomProctor detect error:', err);
        }
    }, [updateCheatingLog]);

    useEffect(() => {
        if (!remoteStream) return;

        const video = videoRef.current;
        if (video) {
            video.srcObject = remoteStream;
            video.play().catch(() => { });
        }

        // Load model then start detection loop
        cocossd.load().then((model) => {
            modelRef.current = model;
            intervalRef.current = setInterval(detect, 2000);
        }).catch((err) => {
            console.warn('RoomProctor: failed to load coco-ssd', err);
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [remoteStream, detect]);

    return (
        // Both elements are hidden — detection happens off-screen
        <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
};

export default RoomProctor;
