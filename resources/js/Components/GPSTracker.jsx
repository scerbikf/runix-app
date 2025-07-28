import React, { useState, useEffect, useRef } from 'react';

function GPSTracker({ isTracking, onDistanceUpdate, onLocationUpdate }) {
    const [gpsStatus, setGpsStatus] = useState('idle'); // idle, requesting, active, error
    const [accuracy, setAccuracy] = useState(null);
    const [totalDistance, setTotalDistance] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [positions, setPositions] = useState([]);
    
    const watchIdRef = useRef(null);
    const lastPositionRef = useRef(null);

    // Funkcia na výpočet vzdialenosti medzi dvoma GPS bodmi (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // Polomer Zeme v metroch
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance; // vracia vzdialenosť v metroch
    };

    // Spustí GPS tracking
    const startGPSTracking = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            console.error('Geolocation is not supported by this browser.');
            return;
        }

        setGpsStatus('requesting');

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        // Získaj počiatočnú polohu
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Initial GPS position obtained:', position);
                setGpsStatus('active');
                setAccuracy(position.coords.accuracy);
                
                const initialPos = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timestamp: Date.now(),
                    accuracy: position.coords.accuracy
                };
                
                setPositions([initialPos]);
                lastPositionRef.current = initialPos;
                
                if (onLocationUpdate) {
                    onLocationUpdate(initialPos);
                }

                // Začni sledovať zmeny polohy
                watchIdRef.current = navigator.geolocation.watchPosition(
                    handlePositionUpdate,
                    handleGPSError,
                    options
                );
            },
            handleGPSError,
            options
        );
    };

    // Spracuje aktualizáciu polohy
    const handlePositionUpdate = (position) => {
        const newPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0
        };

        setAccuracy(position.coords.accuracy);
        setCurrentSpeed((position.coords.speed || 0) * 3.6); // m/s na km/h

        if (lastPositionRef.current) {
            // Filtrovanie nepresných meraní
            if (position.coords.accuracy > 50) {
                console.log('GPS accuracy too low, skipping update');
                return;
            }

            // Výpočet vzdialenosti od poslednej pozície
            const distance = calculateDistance(
                lastPositionRef.current.latitude,
                lastPositionRef.current.longitude,
                newPos.latitude,
                newPos.longitude
            );

            // Filtrovanie nereálnych skokov (viac ako 100m za sekundu = 360 km/h)
            const timeDiff = (newPos.timestamp - lastPositionRef.current.timestamp) / 1000;
            const maxReasonableDistance = timeDiff * 100; // 100 m/s = 360 km/h

            if (distance < maxReasonableDistance && distance > 1) {
                setTotalDistance(prev => {
                    const newTotal = prev + distance;
                    const distanceInKm = newTotal / 1000;
                    
                    // Pošli aktualizáciu vzdialenosti
                    if (onDistanceUpdate) {
                        onDistanceUpdate(distanceInKm);
                    }
                    
                    return newTotal;
                });

                setPositions(prev => [...prev, newPos]);
                lastPositionRef.current = newPos;

                console.log(`Distance update: +${distance.toFixed(2)}m, Total: ${((totalDistance + distance) / 1000).toFixed(3)}km`);
            } else if (distance > maxReasonableDistance) {
                console.log(`GPS jump detected: ${distance.toFixed(2)}m in ${timeDiff.toFixed(2)}s, skipping`);
            }
        } else {
            lastPositionRef.current = newPos;
        }

        if (onLocationUpdate) {
            onLocationUpdate(newPos);
        }
    };

    // Spracuje GPS chyby
    const handleGPSError = (error) => {
        console.error('GPS Error:', error);
        setGpsStatus('error');
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                console.error("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.error("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                console.error("The request to get user location timed out.");
                break;
            default:
                console.error("An unknown error occurred.");
                break;
        }
    };

    // Zastaví GPS tracking
    const stopGPSTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setGpsStatus('idle');
        setTotalDistance(0);
        setPositions([]);
        lastPositionRef.current = null;
    };

    // Efekt pre spustenie/zastavenie trackingu
    useEffect(() => {
        if (isTracking && gpsStatus === 'idle') {
            startGPSTracking();
        } else if (!isTracking && gpsStatus !== 'idle') {
            stopGPSTracking();
        }
    }, [isTracking]);

    // Cleanup pri unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Render GPS status indikátora
    const renderGPSStatus = () => {
        switch (gpsStatus) {
            case 'requesting':
                return (
                    <div className="flex items-center text-yellow-600">
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Získavam GPS signál...
                    </div>
                );
            case 'active':
                return (
                    <div className="flex items-center text-green-600">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        GPS aktívny ({accuracy ? `±${accuracy.toFixed(0)}m` : ''})
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center text-red-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        GPS nedostupný
                    </div>
                );
            default:
                return (
                    <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        GPS vypnutý
                    </div>
                );
        }
    };

    return (
        <div className="bg-blue-50 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between">
                <div>
                    {renderGPSStatus()}
                    {currentSpeed > 0 && gpsStatus === 'active' && (
                        <div className="text-xs text-gray-600 mt-1">
                            Rýchlosť: {currentSpeed.toFixed(1)} km/h
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-sm font-semibold text-blue-700">
                        {(totalDistance / 1000).toFixed(3)} km
                    </div>
                    <div className="text-xs text-gray-600">
                        GPS vzdialenosť
                    </div>
                </div>
            </div>
            
            {gpsStatus === 'error' && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                    Povoľte prístup k polohe pre automatické meranie vzdialenosti
                </div>
            )}
        </div>
    );
}

export default GPSTracker;
