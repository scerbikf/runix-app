<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test user with properly hashed password';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = 'test@runix.com';
        $password = 'password123';
        
        // Delete existing user if exists
        User::where('email', $email)->delete();
        
        // Create new user with properly hashed password
        $user = User::create([
            'name' => 'Test User',
            'email' => $email,
            'password' => Hash::make($password),
        ]);
        
        $this->info("Test user created successfully!");
        $this->info("Email: {$email}");
        $this->info("Password: {$password}");
        $this->info("User ID: {$user->id}");
        
        return 0;
    }
}
