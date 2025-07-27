import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Activities from './Activities';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Moje Aktivity
                        </h2>
                        <p className="text-gray-600 mt-1">Sleduj svoje tréningy a dosiahni svoje ciele</p>
                    </div>
                    <div className="hidden sm:flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Dnešný dátum</div>
                            <div className="text-lg font-semibold text-gray-800">
                                {new Date().toLocaleDateString('sk-SK', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Moje Aktivity" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Activities />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
