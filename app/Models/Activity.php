<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'distance',
        'duration',
        'started_at',
        'ended_at',
        'notes',
        'user_id',
        'is_tracking',
        'tracking_started_at',
        'current_distance',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'tracking_started_at' => 'datetime',
        'is_tracking' => 'boolean',
        'current_distance' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pre získanie aktívneho trackingu používateľa
     */
    public function scopeActiveTracking($query, $userId)
    {
        return $query->where('user_id', $userId)
                    ->where('is_tracking', true);
    }

    /**
     * Vypočíta trvanie aktivity v sekundách
     */
    public function calculateDuration()
    {
        if ($this->is_tracking && $this->tracking_started_at) {
            return now()->diffInSeconds($this->tracking_started_at);
        }
        return $this->duration;
    }

    /**
     * Ukončí tracking aktivity
     */
    public function stopTracking()
    {
        $this->update([
            'is_tracking' => false,
            'ended_at' => now(),
            'duration' => $this->calculateDuration(),
            'distance' => $this->current_distance * 1000, // Prevod km na metre
        ]);
    }
}
