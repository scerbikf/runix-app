<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // API route pre aktuálneho používateľa
    Route::get('/user', function () {
        return auth()->user();
    });

    Route::apiResource('activities', ActivityController::class)->parameters([
        'activities' => 'activity'
    ]);

    // Tracking routes
    Route::post('/activities/start-tracking', [ActivityController::class, 'startTracking'])->name('activities.start-tracking');
    Route::post('/activities/stop-tracking', [ActivityController::class, 'stopTracking'])->name('activities.stop-tracking');
    Route::post('/activities/update-tracking', [ActivityController::class, 'updateTracking'])->name('activities.update-tracking');
    Route::get('/activities/active-tracking', [ActivityController::class, 'getActiveTracking'])->name('activities.active-tracking');
});


require __DIR__.'/auth.php';
