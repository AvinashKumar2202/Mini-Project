import { useState, useEffect } from 'react';

const useBattery = () => {
    const [batteryLevel, setBatteryLevel] = useState(null);
    const [isCharging, setIsCharging] = useState(true);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        let batteryMonitor = null;

        const updateBatteryInfo = (battery) => {
            setBatteryLevel(battery.level * 100);
            setIsCharging(battery.charging);
        };

        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                batteryMonitor = battery;
                updateBatteryInfo(battery);

                battery.addEventListener('levelchange', () => updateBatteryInfo(battery));
                battery.addEventListener('chargingchange', () => updateBatteryInfo(battery));
            });
        } else {
            setSupported(false);
        }

        return () => {
            if (batteryMonitor) {
                batteryMonitor.removeEventListener('levelchange', updateBatteryInfo);
                batteryMonitor.removeEventListener('chargingchange', updateBatteryInfo);
            }
        };
    }, []);

    return { batteryLevel, isCharging, supported };
};

export default useBattery;
