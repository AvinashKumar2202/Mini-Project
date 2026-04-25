import React, { useRef, useEffect } from 'react';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';

export default function Home({ updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const lastAlertRef = useRef({ noFace: 0, cellPhone: 0, prohibited: 0, multipleFaces: 0 });

  const runCoco = async () => {
    try {
      const net = await cocossd.load();
      if (!isMounted.current) return;
      
      console.log('Ai models loaded.');

      intervalRef.current = setInterval(() => {
        if (isMounted.current) {
          detect(net);
        }
      }, 3000);
    } catch (err) {
      console.error("Failed to load COCO-SSD model:", err);
    }
  };

  const detect = async (net) => {
    if (
      isMounted.current &&
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      const obj = await net.detect(video);
      if (!isMounted.current) return;

      let person_count = 0;
      const now = Date.now();
      
      if (obj.length < 1) {
        if (now - lastAlertRef.current.noFace > 10000) {
          lastAlertRef.current.noFace = now;
          updateCheatingLog((prevLog) => ({
            ...prevLog,
            noFaceCount: prevLog.noFaceCount + 1,
          }));
          toast.error('Face Not Visible! Action recorded.', { autoClose: 3000, toastId: 'noface' });
        }
      }
      
      obj.forEach((element) => {
        if (element.class === 'cell phone') {
          if (now - lastAlertRef.current.cellPhone > 10000) {
            lastAlertRef.current.cellPhone = now;
            updateCheatingLog((prevLog) => ({
              ...prevLog,
              cellPhoneCount: prevLog.cellPhoneCount + 1,
            }));
            toast.error('Cell Phone Detected! Action recorded.', { autoClose: 3000, toastId: 'phone' });
          }
        }
        if (element.class === 'book') {
          if (now - lastAlertRef.current.prohibited > 10000) {
            lastAlertRef.current.prohibited = now;
            updateCheatingLog((prevLog) => ({
              ...prevLog,
            prohibitedObjectCount: prevLog.prohibitedObjectCount + 1,
            }));
            toast.error('Prohibited Object Detected! Action recorded.', { autoClose: 3000, toastId: 'book' });
          }
        }

        if (element.class === 'person') {
          person_count++;
          if (person_count > 1) {
            if (now - lastAlertRef.current.multipleFaces > 10000) {
              lastAlertRef.current.multipleFaces = now;
              updateCheatingLog((prevLog) => ({
                ...prevLog,
                multipleFaceCount: prevLog.multipleFaceCount + 1,
              }));
              toast.error('Multiple Faces Detected! Action recorded.', { autoClose: 3000, toastId: 'multiface' });
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    isMounted.current = true;
    runCoco();
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <Webcam
        ref={webcamRef}
        muted={true}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#000'
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 8,
        }}
      />
    </>
  );
}
