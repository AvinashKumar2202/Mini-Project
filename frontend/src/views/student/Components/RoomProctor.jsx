import React, { useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { toast } from 'react-toastify';

/**
 * RoomProctor
 *
 * Hidden component that runs COCO-SSD person detection on the
 * remote mobile camera stream every 2 seconds.
 */
const RoomProctor = ({ remoteStream, updateCheatingLog }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const modelRef = useRef(null);
    const isMounted = useRef(true);
    const lastAlertRef = useRef(0);

    const detect = useCallback(async () => {
        if (!isMounted.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !modelRef.current) return;
        if (video.readyState < 4 || video.videoWidth === 0) return;

        try {
            const objs = await modelRef.current.detect(video);
            if (!isMounted.current) return;

            const people = objs.filter((o) => o.class === 'person');

            if (people.length > 1) {
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
        isMounted.current = true;
        if (!remoteStream) return;

        const video = videoRef.current;
        if (video) {
            video.srcObject = remoteStream;
            video.play().catch(() => { });
        }

        cocossd.load().then((model) => {
            if (!isMounted.current) return;
            modelRef.current = model;
            intervalRef.current = setInterval(detect, 2000);
        }).catch((err) => {
            console.warn('RoomProctor: failed to load coco-ssd', err);
        });

        return () => {
            isMounted.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [remoteStream, detect]);

    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            />
            <canvas ref={canvasRef} style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
        </>
    );
};

export default RoomProctor;
