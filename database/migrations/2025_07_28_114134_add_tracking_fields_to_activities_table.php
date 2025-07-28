<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->boolean('is_tracking')->default(false)->after('user_id');
            $table->timestamp('tracking_started_at')->nullable()->after('is_tracking');
            $table->decimal('current_distance', 8, 2)->default(0)->after('tracking_started_at');
            $table->timestamp('ended_at')->nullable()->after('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['is_tracking', 'tracking_started_at', 'current_distance', 'ended_at']);
        });
    }
};
