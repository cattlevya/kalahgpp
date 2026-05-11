import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, MessageSquare, CheckCircle, AlertCircle, Plus, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import BookingModal from '../components/modals/BookingModal';
import { Card, Badge, Button, cn } from '../components/ui/Widgets';

const Konsultasi = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'

    const fetchAppointments = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let res;
            if (user.role === 'expert') {
                res = await api.getExpertAppointments(user.id);
            } else {
                res = await api.getPatientAppointments(user.id);
            }

            if (res.success) {
                setAppointments(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const handleStatusUpdate = async (id, status) => {
        // Only for experts
        if (user.role !== 'expert') return;

        const responseText = status === 'approved' ? 'Jadwal dikonfirmasi.' : 'Mohon maaf, jadwal tidak tersedia.';
        const res = await api.respondAppointment(id, status, responseText);
        if (res.success) {
            fetchAppointments(); // Refresh list
        }
    };

    const handleCancelAppointment = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin membatalkan janji ini?')) {
            const res = await api.cancelAppointment(id);
            if (res.success) {
                fetchAppointments();
            }
        }
    };

    // Filter appointments
    const now = new Date();
    const upcomingAppointments = appointments.filter(a => new Date(a.requested_date) >= now && a.status !== 'rejected' && a.status !== 'cancelled');
    const historyAppointments = appointments.filter(a => new Date(a.requested_date) < now || a.status === 'rejected' || a.status === 'cancelled');

    const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

    const handleChat = (targetId) => {
        // Navigate to chat with the specific contact ID
        navigate('/chat', { state: { targetContactId: targetId } });
    };

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                userId={user?.id}
                history={[]} // Optional: Pass history if needed
                onSuccess={() => {
                    fetchAppointments();
                    setShowBookingModal(false);
                }}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 md:mt-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Jadwal Konsultasi</h1>
                    <p className="text-sm md:text-base text-slate-500">
                        {user?.role === 'expert'
                            ? 'Kelola jadwal praktek dan permintaan konsultasi masuk.'
                            : 'Lihat jadwal temu dengan dokter spesialis.'}
                    </p>
                </div>
                {user?.role === 'patient' && (
                    <Button
                        onClick={() => setShowBookingModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Buat Janji Baru
                    </Button>
                )}
            </div>

            {/* TAB CONTROLS */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={cn(
                        "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === 'upcoming' ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Jadwal Aktif ({upcomingAppointments.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                        activeTab === 'history' ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Clock size={16} />
                    Riwayat ({historyAppointments.length})
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64 bg-white rounded-3xl border border-slate-100">
                        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : displayedAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-3xl border border-slate-100">
                        <Calendar className="w-12 h-12 mb-4 opacity-20" />
                        <p>{activeTab === 'upcoming' ? 'Tidak ada jadwal aktif.' : 'Belum ada riwayat konsultasi.'}</p>
                    </div>
                ) : (
                    displayedAppointments.map((appt) => {
                        const dateObj = new Date(appt.requested_date);
                        const day = dateObj.getDate();
                        const month = dateObj.toLocaleDateString('id-ID', { month: 'short' });
                        const time = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                        const isExpert = user?.role === 'expert';

                        return (
                            <div key={appt.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 group">
                                {/* Date Box */}
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center border border-blue-100 text-blue-600">
                                        <span className="text-xl font-bold leading-none">{day}</span>
                                        <span className="text-xs font-bold uppercase mt-1">{month}</span>
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-800 text-lg truncate">
                                            {isExpert
                                                ? appt.patient_name
                                                : `dr. ${appt.doctor_name}${appt.doctor_title ? `, ${appt.doctor_title}` : ''}`
                                            }
                                        </h3>
                                        <Badge variant={
                                            appt.status === 'approved' ? 'success' :
                                                (appt.status === 'rejected' || appt.status === 'cancelled') ? 'danger' : 'warning'
                                        } className="min-w-[180px] justify-center text-center px-4 py-1.5">
                                            {appt.status === 'approved' ? 'Dikonfirmasi' :
                                                appt.status === 'rejected' ? 'Ditolak Dokter' :
                                                    appt.status === 'cancelled' ? 'Dibatalkan' : 'Menunggu Konfirmasi'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                            <Clock size={14} className="text-slate-400" />
                                            {time} WIB
                                        </span>
                                        {!isExpert && (
                                            <span className="flex items-center gap-1.5">
                                                <User size={14} className="text-slate-400" />
                                                {appt.doctor_title || 'Sp.P'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Notes / Diagnosis */}
                                    {isExpert && appt.diagnosis_result && (
                                        <div className="mb-3">
                                            <Badge variant="teal" className="bg-teal-50 text-teal-700 border border-teal-200">
                                                Diagnosa: {appt.diagnosis_result} ({appt.confidence_score}%)
                                            </Badge>
                                        </div>
                                    )}
                                    {appt.notes && (
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                            "{appt.notes}"
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 md:w-[220px] flex-shrink-0">
                                    {appt.status === 'approved' && (
                                        <Button
                                            onClick={() => handleChat(isExpert ? appt.user_id : appt.doctor_id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl flex items-center justify-center gap-2 w-full md:w-auto"
                                        >
                                            <MessageSquare size={16} />
                                            Chat
                                        </Button>
                                    )}

                                    {!isExpert && appt.status === 'pending' && (
                                        <Button
                                            onClick={() => handleCancelAppointment(appt.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-sm px-4 py-2 rounded-xl flex items-center justify-center gap-2 w-full md:w-auto transition-colors"
                                        >
                                            <XCircle size={16} />
                                            Batalkan
                                        </Button>
                                    )}

                                    {isExpert && appt.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => handleStatusUpdate(appt.id, 'approved')}
                                                className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-xl w-full md:w-auto"
                                            >
                                                Terima
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                                                className="text-red-600 border-red-200 hover:bg-red-50 text-sm px-4 py-2 rounded-xl w-full md:w-auto"
                                            >
                                                Tolak
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Konsultasi;
