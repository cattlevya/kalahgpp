import React, { useState, useEffect } from 'react';
import { History, Calendar, ArrowRight, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Riwayat = () => {
    const { user, loading: authLoading } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        const fetchHistory = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await api.getHistory(user.id);
                if (res.success) {
                    setHistory(res.data);
                } else {
                    setError('Gagal memuat riwayat.');
                }
            } catch (err) {
                console.error("Error fetching history:", err);
                setError('Terjadi kesalahan koneksi.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user, authLoading]);

    // Helper to determine risk level based on score or diagnosis text
    const getRiskLevel = (item) => {
        const score = item.confidence_score || 0;
        const diagnosis = item.final_result?.toLowerCase() || '';

        if (score >= 85 || diagnosis.includes('bahaya') || diagnosis.includes('darurat') || diagnosis.includes('kritis')) {
            return 'High';
        } else if (score >= 50 || diagnosis.includes('periksa') || diagnosis.includes('lanjut')) {
            return 'Medium';
        }
        return 'Low';
    };

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500">Memuat riwayat diagnosa...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Terjadi Kesalahan</h3>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                    <div className="p-3 bg-indigo-50 rounded-xl mr-4">
                        <History className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Riwayat Diagnosa</h1>
                        <p className="text-sm md:text-base text-slate-500">Rekam jejak pemeriksaan kesehatan Anda.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {history.length > 0 ? (
                    history.map((item, index) => {
                        const riskLevel = getRiskLevel(item);
                        return (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow"
                            >
                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center text-sm text-slate-400 mb-2">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">{item.final_result}</h3>
                                    <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                                        Skor Keyakinan: {item.confidence_score}%
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                                            riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                        }`}>
                                        {riskLevel === 'High' ? 'Bahaya' : riskLevel === 'Medium' ? 'Waspada' : 'Aman'}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                        <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Belum ada riwayat</h3>
                        <p className="text-slate-500 mb-6">Lakukan diagnosa pertama Anda sekarang.</p>
                        <a href="/diagnosa" className="inline-flex items-center text-blue-600 font-medium hover:underline">
                            Mulai Diagnosa <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Riwayat;
