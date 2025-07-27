import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Activities() {
    const [activities, setActivities] = useState([]);
    const [deletingIds, setDeletingIds] = useState(new Set());
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        distance: '',
        duration: '',
        started_at: '',
        notes: ''
    });

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = () => {
        axios.get('/activities')
            .then(response => {
                setActivities(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the activities!", error);
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const activityData = {
            ...form,
            distance: parseInt(form.distance, 10) * 1000, // Prevod km na metre
            duration: parseInt(form.duration, 10) * 60, // Prevod minút na sekundy
        };

        axios.post('/activities', activityData)
            .then(response => {
                setActivities(prevActivities => [response.data, ...prevActivities]);
                setForm({ name: '', distance: '', duration: '', started_at: '', notes: '' }); // Reset form
                setShowForm(false); // Hide form after successful submission
            })
            .catch(error => {
                console.error("There was an error creating the activity!", error);
                if (error.response) {
                    console.error('Validation Errors:', error.response.data.errors);
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleDelete = (id) => {
        if (confirm('Ste si istí, že chcete vymazať túto aktivitu?')) {
            setDeletingIds(prev => new Set(prev).add(id));
            
            axios.delete(`/activities/${id}`)
                .then((response) => {
                    console.log('Activity deleted successfully:', response.data);
                    setActivities(prevActivities => prevActivities.filter(activity => activity.id !== id));
                })
                .catch(error => {
                    console.error("There was an error deleting the activity!", error);
                    if (error.response) {
                        console.error('Error status:', error.response.status);
                        console.error('Error data:', error.response.data);
                        alert(`Chyba pri mazaní aktivity: ${error.response.data.message || error.response.statusText}`);
                    } else {
                        alert('Chyba pri mazaní aktivity. Skontrolujte konzolu pre viac detailov.');
                    }
                })
                .finally(() => {
                    setDeletingIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(id);
                        return newSet;
                    });
                });
        }
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    };

    const calculatePace = (distance, duration) => {
        const paceSeconds = duration / (distance / 1000);
        const paceMinutes = Math.floor(paceSeconds / 60);
        const paceSecondsRemainder = Math.floor(paceSeconds % 60);
        return `${paceMinutes}:${paceSecondsRemainder.toString().padStart(2, '0')}/km`;
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Celkovo aktivít</p>
                            <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Celková vzdialenosť</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(activities.reduce((sum, activity) => sum + activity.distance, 0) / 1000).toFixed(1)} km
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Celkový čas</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatDuration(activities.reduce((sum, activity) => sum + activity.duration, 0))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Priem. tempo</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {activities.length > 0 ? 
                                    calculatePace(
                                        activities.reduce((sum, activity) => sum + activity.distance, 0) / activities.length,
                                        activities.reduce((sum, activity) => sum + activity.duration, 0) / activities.length
                                    ) : '0:00/km'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Activity Button */}
            <div className="flex justify-center sm:justify-start">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 transform hover:scale-105"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                    </svg>
                    {showForm ? 'Zrušiť' : 'Pridať aktivitu'}
                </button>
            </div>

            {/* Add Activity Form */}
            {showForm && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-lg border border-white/20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Pridať novú aktivitu</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Názov aktivity</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    id="name" 
                                    value={form.name} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                    placeholder="napr. Ranný beh"
                                />
                            </div>
                            <div>
                                <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">Vzdialenosť (km)</label>
                                <input 
                                    type="number" 
                                    name="distance" 
                                    id="distance" 
                                    value={form.distance} 
                                    onChange={handleInputChange} 
                                    required 
                                    step="0.1"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                    placeholder="5.0"
                                />
                            </div>
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">Trvanie (minúty)</label>
                                <input 
                                    type="number" 
                                    name="duration" 
                                    id="duration" 
                                    value={form.duration} 
                                    onChange={handleInputChange} 
                                    required 
                                    min="1"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                    placeholder="30"
                                />
                            </div>
                            <div>
                                <label htmlFor="started_at" className="block text-sm font-medium text-gray-700 mb-2">Dátum a čas</label>
                                <input 
                                    type="datetime-local" 
                                    name="started_at" 
                                    id="started_at" 
                                    value={form.started_at} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Poznámky (voliteľné)</label>
                            <textarea 
                                name="notes" 
                                id="notes" 
                                value={form.notes} 
                                onChange={handleInputChange} 
                                rows="3" 
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                placeholder="Ako sa cítite? Ako prebehol tréning?"
                            ></textarea>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="flex-1 inline-flex justify-center items-center py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Ukladám...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Uložiť aktivitu
                                    </>
                                )}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className="flex-1 sm:flex-none inline-flex justify-center items-center py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
                            >
                                Zrušiť
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Activities List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Posledné aktivity</h2>
                
                {activities.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center shadow-lg border border-white/20">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Žiadne aktivity</h3>
                        <p className="text-gray-500 mb-4">Začnite sledovať svoje tréningy pridaním prvej aktivity.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Pridať prvú aktivitu
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:gap-6">
                        {activities.map(activity => (
                            <div key={activity.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition duration-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mr-3">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{activity.name}</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">Vzdialenosť</span>
                                            </div>
                                            <div className="font-semibold text-gray-900">{(activity.distance / 1000).toFixed(2)} km</div>
                                            
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">Trvanie</span>
                                            </div>
                                            <div className="font-semibold text-gray-900">{formatDuration(activity.duration)}</div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">Tempo</span>
                                            </div>
                                            <div className="font-semibold text-gray-900">{calculatePace(activity.distance, activity.duration)}</div>
                                            
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">Dátum</span>
                                            </div>
                                            <div className="font-semibold text-gray-900">{new Date(activity.started_at).toLocaleDateString('sk-SK')}</div>
                                        </div>

                                        {activity.notes && (
                                            <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                                <p className="text-gray-600 italic">"{activity.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            disabled={deletingIds.has(activity.id)}
                                            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                                        >
                                            {deletingIds.has(activity.id) ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                                                    </svg>
                                                    Mazanie...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Vymazať
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Activities;
