import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import GPSTracker from './GPSTracker';

function ActivityTracker({ onTrackingUpdate }) {
    const [isTracking, setIsTracking] = useState(false);
    const [activity, setActivity] = useState(null);
    const [duration, setDuration] = useState(0);
    const [distance, setDistance] = useState(0);
    const [gpsDistance, setGpsDistance] = useState(0);
    const [activityName, setActivityName] = useState('');
    const [showStartModal, setShowStartModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useGPS, setUseGPS] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    
    const intervalRef = useRef(null);

    useEffect(() => {
        checkActiveTracking();
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isTracking && activity) {
            intervalRef.current = setInterval(() => {
                const startTime = new Date(activity.tracking_started_at);
                const currentDuration = Math.floor((Date.now() - startTime.getTime()) / 1000);
                setDuration(currentDuration);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isTracking, activity]);

    const checkActiveTracking = async () => {
        try {
            const response = await axios.get('/activities/active-tracking');
            if (response.data) {
                setActivity(response.data);
                setIsTracking(true);
                setDistance(response.data.current_distance || 0);
                setActivityName(response.data.name);
            }
        } catch (error) {
            // Žiadny aktívny tracking
            setIsTracking(false);
            setActivity(null);
        }
    };

    const startTracking = async () => {
        if (!activityName.trim()) {
            alert('Prosím zadajte názov aktivity');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/activities/start-tracking', {
                name: activityName
            });

            setActivity(response.data);
            setIsTracking(true);
            setDuration(0);
            setDistance(0);
            setShowStartModal(false);
            setActivityName('');
            
            if (onTrackingUpdate) {
                onTrackingUpdate();
            }
        } catch (error) {
            console.error('Error starting tracking:', error);
            alert('Chyba pri spustení trackingu');
        } finally {
            setIsLoading(false);
        }
    };

    const stopTracking = async () => {
        setIsLoading(true);
        try {
            const finalDistance = useGPS ? gpsDistance : distance;
            await axios.post('/activities/stop-tracking', {
                distance: finalDistance,
                notes: notes
            });

            setIsTracking(false);
            setActivity(null);
            setDuration(0);
            setDistance(0);
            setGpsDistance(0);
            setNotes('');
            setShowStopModal(false);
            setCurrentLocation(null);
            
            if (onTrackingUpdate) {
                onTrackingUpdate();
            }
        } catch (error) {
            console.error('Error stopping tracking:', error);
            alert('Chyba pri ukončení trackingu');
        } finally {
            setIsLoading(false);
        }
    };

    const updateDistance = async (newDistance) => {
        if (!isTracking) return;

        setDistance(newDistance);
        
        try {
            await axios.post('/activities/update-tracking', {
                distance: newDistance
            });
        } catch (error) {
            console.error('Error updating distance:', error);
        }
    };

    // Callback pre GPS aktualizácie vzdialenosti
    const handleGPSDistanceUpdate = (gpsDistanceKm) => {
        setGpsDistance(gpsDistanceKm);
        if (useGPS) {
            setDistance(gpsDistanceKm);
            updateDistance(gpsDistanceKm);
        }
    };

    // Callback pre GPS aktualizácie polohy
    const handleLocationUpdate = (location) => {
        setCurrentLocation(location);
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const calculatePace = () => {
        if (distance === 0 || duration === 0) return '0:00/km';
        const paceSeconds = duration / distance;
        const paceMinutes = Math.floor(paceSeconds / 60);
        const paceSecondsRemainder = Math.floor(paceSeconds % 60);
        return `${paceMinutes}:${paceSecondsRemainder.toString().padStart(2, '0')}/km`;
    };

    return (
        <div className="space-y-4">
            {/* Tracking Panel */}
            {isTracking ? (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                            <h3 className="text-xl font-bold">AKTÍVNY TRACKING</h3>
                        </div>
                        <button
                            onClick={() => setShowStopModal(true)}
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition duration-200"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                            </svg>
                            STOP
                        </button>
                    </div>
                    
                    <div className="mb-4">
                        <p className="text-green-100 mb-1">Aktivita:</p>
                        <p className="text-2xl font-bold">{activity?.name}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-green-100">Čas</span>
                            </div>
                            <div className="text-3xl font-mono font-bold">{formatTime(duration)}</div>
                        </div>

                        <div className="bg-white/10 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-green-100">Vzdialenosť</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    {useGPS ? (
                                        <div className="text-3xl font-mono font-bold">{gpsDistance.toFixed(3)} km</div>
                                    ) : (
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                value={distance}
                                                onChange={(e) => updateDistance(parseFloat(e.target.value) || 0)}
                                                step="0.1"
                                                min="0"
                                                className="bg-white/20 text-white placeholder-green-200 border-0 rounded-lg px-3 py-2 w-20 text-xl font-bold mr-2 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                                            />
                                            <span className="text-xl font-bold">km</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setUseGPS(!useGPS)}
                                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition"
                                >
                                    {useGPS ? '📍 GPS' : '✏️ Manual'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/10 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-green-100">Tempo</span>
                            </div>
                            <div className="text-2xl font-mono font-bold">{calculatePace()}</div>
                        </div>
                    </div>

                    {/* GPS Tracker Component */}
                    <GPSTracker 
                        isTracking={isTracking}
                        onDistanceUpdate={handleGPSDistanceUpdate}
                        onLocationUpdate={handleLocationUpdate}
                    />
                </div>
            ) : (
                <div className="text-center">
                    <button
                        onClick={() => setShowStartModal(true)}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transition duration-200 transform hover:scale-105"
                    >
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-9V3m0 0L9 6m3-3l3 3" />
                        </svg>
                        ŠTART TRACKING
                    </button>
                </div>
            )}

            {/* Start Modal */}
            {showStartModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Spustiť tracking</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Názov aktivity
                            </label>
                            <input
                                type="text"
                                value={activityName}
                                onChange={(e) => setActivityName(e.target.value)}
                                placeholder="napr. Ranný beh, Cycling..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && startTracking()}
                                autoFocus
                            />
                        </div>
                        
                        <div className="mb-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">GPS tracking</span>
                                    <p className="text-xs text-gray-500">Automatické meranie vzdialenosti</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useGPS}
                                        onChange={(e) => setUseGPS(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={startTracking}
                                disabled={isLoading || !activityName.trim()}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {isLoading ? 'Spúšťam...' : 'Štart'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowStartModal(false);
                                    setActivityName('');
                                }}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition duration-200"
                            >
                                Zrušiť
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stop Modal */}
            {showStopModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Ukončiť tracking</h3>
                        
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Súhrn aktivity:</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p><strong>Aktivita:</strong> {activity?.name}</p>
                                <p><strong>Čas:</strong> {formatTime(duration)}</p>
                                <p><strong>Vzdialenosť:</strong> {useGPS ? gpsDistance.toFixed(3) : distance} km {useGPS ? '(GPS)' : '(Manuálne)'}</p>
                                {useGPS && gpsDistance !== distance && (
                                    <p className="text-xs"><strong>Manuálne zadané:</strong> {distance} km</p>
                                )}
                                <p><strong>Tempo:</strong> {calculatePace()}</p>
                                {currentLocation && (
                                    <p className="text-xs text-blue-600">
                                        <strong>Poloha:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Poznámky (voliteľné)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ako sa cítite? Ako prebehla aktivita?"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={stopTracking}
                                disabled={isLoading}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {isLoading ? 'Ukončujem...' : 'Ukončiť'}
                            </button>
                            <button
                                onClick={() => setShowStopModal(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition duration-200"
                            >
                                Zrušiť
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActivityTracker;
