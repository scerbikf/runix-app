<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ActivityController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $activities = Auth::user()->activities()->orderBy('started_at', 'desc')->get();
        
        // Pridáme informáciu o aktívnom trackingu
        $activeTracking = Auth::user()->activities()
            ->where('is_tracking', true)
            ->first();
            
        return response()->json([
            'activities' => $activities,
            'activeTracking' => $activeTracking
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'distance' => 'required|integer|min:0',
            'duration' => 'required|integer|min:0',
            'started_at' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $activity = Auth::user()->activities()->create($validated);

        return response()->json($activity, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Activity $activity)
    {
        $this->authorize('delete', $activity);

        $activity->delete();

        return response()->json(['message' => 'Activity deleted successfully'], 200);
    }

    /**
     * Spustí tracking novej aktivity
     */
    public function startTracking(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Ukončí všetky aktívne tracking sessiony
        Auth::user()->activities()
            ->where('is_tracking', true)
            ->update(['is_tracking' => false]);

        $activity = Auth::user()->activities()->create([
            'name' => $validated['name'],
            'is_tracking' => true,
            'tracking_started_at' => now(),
            'started_at' => now(),
            'distance' => 0,
            'duration' => 0,
            'current_distance' => 0,
        ]);

        return response()->json($activity, 201);
    }

    /**
     * Ukončí aktívny tracking
     */
    public function stopTracking(Request $request)
    {
        $validated = $request->validate([
            'distance' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $activity = Auth::user()->activities()
            ->where('is_tracking', true)
            ->first();

        if (!$activity) {
            return response()->json(['message' => 'No active tracking found'], 404);
        }

        // Aktualizuj vzdialenosť ak bola poskytnutá
        if (isset($validated['distance'])) {
            $activity->current_distance = $validated['distance'];
        }

        if (isset($validated['notes'])) {
            $activity->notes = $validated['notes'];
        }

        $activity->stopTracking();

        return response()->json($activity);
    }

    /**
     * Aktualizuje aktuálnu vzdialenosť počas trackingu
     */
    public function updateTracking(Request $request)
    {
        $validated = $request->validate([
            'distance' => 'required|numeric|min:0',
        ]);

        $activity = Auth::user()->activities()
            ->where('is_tracking', true)
            ->first();

        if (!$activity) {
            return response()->json(['message' => 'No active tracking found'], 404);
        }

        $activity->update([
            'current_distance' => $validated['distance']
        ]);

        return response()->json($activity);
    }

    /**
     * Získa aktuálny stav trackingu
     */
    public function getActiveTracking()
    {
        $activity = Auth::user()->activities()
            ->where('is_tracking', true)
            ->first();

        if (!$activity) {
            return response()->json(['message' => 'No active tracking'], 404);
        }

        // Vypočítaj aktuálne trvanie
        $activity->current_duration = $activity->calculateDuration();

        return response()->json($activity);
    }
}
