import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, History as HistoryIcon, MessageSquare, Calendar, AlertTriangle, Phone, Check, X, Clock, Plus, MapPin } from 'lucide-react';
import { Card, Badge, Button, cn } from '../components/ui/Widgets';
import BioNetwork from '../components/visuals/BioNetwork';
import { ScoreCard, AQICard, ProfileMiniCard } from '../components/ui/DashboardWidgets';
import BreathingWidget from '../components/dashboard/BreathingWidget';
import DailyTestModal from '../components/modals/DailyTestModal';
import BookingModal from '../components/modals/BookingModal';
import ConsultationCard from '../components/dashboard/ConsultationCard';
import NotificationCard from '../components/dashboard/NotificationCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const DashboardUser = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        userName: '',
        userProfile: {},
        latestScore: null,
        history: []
    });
    const [appointments, setAppointments] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestMessage, setLatestMessage] = useState(null);
    const [aqiData, setAqiData] = useState({ aqi: 0, city: 'Memuat...', pm25: 0, co: 0 });

    // Modals
    const [showTestModal, setShowTestModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        if (user?.id) {
            try {
                // 1. Dashboard Data
                const response = await fetch(`${API_BASE}/dashboard/${user.id}`);
                const result = await response.json();

                if (result.success) {
                    setDashboardData(result.data);
                    if (result.data.latestScore === null) {
                        setShowTestModal(true);
                    }
                }

                // 2. Appointments
                const apptRes = await api.getPatientAppointments(user.id);
                if (apptRes.success) setAppointments(apptRes.data);

                // 3. Contacts / Notifications
                const contactsRes = await api.getContacts(user.id);
                if (contactsRes.success) {
                    const sorted = contactsRes.data.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

                    // Prioritize unread, otherwise null
                    const priorityContact = sorted.find(c => c.unreadCount > 0);

                    if (priorityContact) {
                        setLatestMessage({
                            ...priorityContact,
                            sender_name: priorityContact.role === 'expert'
                                ? `dr. ${priorityContact.name}${priorityContact.title_degree ? `, ${priorityContact.title_degree}` : ''}`
                                : priorityContact.name,
                            content: priorityContact.lastMessage,
                            contact_id: priorityContact.id // Store ID for navigation
                        });
                    } else {
                        setLatestMessage(null);
                    }

                    // Calculate total unread (optional, if you still use unreadCount elsewhere)
                    const totalUnread = sorted.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
                    setUnreadCount(totalUnread);
                }

                // 4. AQI (Auto-fetch if location allowed)
                fetchAQI();

            } catch (error) {
                console.error("Failed to fetch dashboard", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchAQI = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const res = await api.getAQI(pos.coords.latitude, pos.coords.longitude);
                if (res.success) setAqiData(res.data);
            }, (err) => console.log("Loc error", err));
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleTestComplete = async (score) => {
        await api.saveScore(user.id, score);
        setDashboardData(prev => ({ ...prev, latestScore: score }));
        setShowTestModal(false);
    };

    const handleConsultationSuccess = () => {
        fetchData();
    };

    const handleCancelAppointment = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin membatalkan janji ini?')) {
            const res = await api.cancelAppointment(id);
            if (res.success) fetchData();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">

            <DailyTestModal
                isOpen={showTestModal}
                onClose={() => setShowTestModal(false)}
                onComplete={handleTestComplete}
            />

            <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                userId={user.id}
                history={dashboardData.history}
                onSuccess={handleConsultationSuccess}
            />

            <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">

                {/* --- ROW 1: HERO SECTION (FULL WIDTH) --- */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12">
                        <Card className="relative min-h-[300px] md:min-h-[400px] bg-slate-900 border-none text-white overflow-hidden flex flex-col justify-center p-6 md:p-10 shadow-2xl shadow-slate-900/20 rounded-3xl">
                            <BioNetwork />
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-6">
                                    <Badge variant="teal" className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm px-4 py-1.5 text-sm">
                                        Sistem Aktif
                                    </Badge>
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                                            Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{dashboardData.userName}</span>
                                        </h1>
                                        <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
                                            Sistem RESPIRA siap membantu. Pantau kesehatan paru Anda. Lakukan diagnosa lengkap jika merasakan <strong className="text-white">nyeri dada, batuk persisten, atau keluhan fisik lainnya.</strong>
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/diagnosa')}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-none px-8 py-4 text-lg shadow-lg shadow-cyan-500/25 rounded-xl"
                                    >
                                        <Activity className="w-5 h-5 mr-3" />
                                        Mulai Diagnosa Gejala
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* --- ROW 2: BENTO METRICS (3 Columns) --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* 1. Lung Score */}
                    <div className="col-span-12 md:col-span-4 h-[250px]">
                        <ScoreCard score={dashboardData.latestScore || 0} />
                    </div>
                    {/* 2. AQI */}
                    <div className="col-span-12 md:col-span-4 h-[250px]">
                        <AQICard data={aqiData} onRefresh={fetchAQI} />
                    </div>
                    {/* 3. Profile */}
                    <div className="col-span-12 md:col-span-4 h-[250px]">
                        <ProfileMiniCard
                            profile={dashboardData.userProfile}
                            name={dashboardData.userName}
                            email={user?.email}
                            onEdit={() => navigate('/profile')}
                        />
                    </div>
                </div>

                {/* --- ROW 3: ACTIONS & HISTORY --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Left: Breathing Exercise (Span 4) */}
                    <div className="col-span-12 md:col-span-4 h-full min-h-[400px]">
                        <BreathingWidget />
                    </div>

                    {/* Right: History & Telemedicine (Span 8) */}
                    <div className="col-span-12 md:col-span-8 space-y-6">

                        {/* 1. Telemedicine Row (Chat & Schedule) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[280px]"> {/* Fixed height for alignment */}
                            {/* Chat Widget */}
                            <NotificationCard
                                message={latestMessage}
                                onReply={() => navigate('/chat', {
                                    state: { targetContactId: latestMessage?.contact_id }
                                })}
                            />

                            {/* Schedule Widget */}
                            <ConsultationCard
                                appointment={appointments.filter(a => new Date(a.requested_date) >= new Date().setHours(0, 0, 0, 0) && a.status !== 'rejected')[0] || null}
                                onBookNew={() => setShowBookingModal(true)}
                                onCancel={handleCancelAppointment}
                            />
                        </div>

                        {/* 2. History List */}
                        <Card className="p-6 bg-white border-slate-100 shadow-sm rounded-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <HistoryIcon className="w-5 h-5 text-slate-400" />
                                    Riwayat Diagnosa Terkini
                                </h3>
                                <Link to="/riwayat" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide">
                                    Lihat Semua
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {dashboardData.history.slice(0, 3).map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                                log.confidence_score >= 75 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                                            )}>
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{log.final_result}</p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(log.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold",
                                            log.confidence_score >= 75 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {log.confidence_score >= 75 ? "Risiko Tinggi" : "Normal"}
                                        </div>
                                    </div>
                                ))}
                                {dashboardData.history.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        Belum ada riwayat diagnosa.
                                    </div>
                                )}
                            </div>
                        </Card>

                    </div>
                </div>

                {/* --- ROW 4: EMERGENCY (Full Width) --- */}
                <div className="grid grid-cols-12">
                    <div className="col-span-12">
                        <Card className="p-1 bg-gradient-to-r from-red-500 to-rose-600 border-none shadow-lg shadow-red-500/20 rounded-3xl">
                            <div className="bg-white rounded-[20px] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-7 h-7 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Butuh Bantuan Medis Darurat?</h3>
                                        <p className="text-sm text-slate-500 max-w-lg">
                                            Jangan ragu untuk mencari pertolongan jika Anda mengalami gejala kritis seperti sesak napas berat.
                                        </p>
                                    </div>
                                </div>
                                <Button className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white border-none px-8 py-3 rounded-xl shadow-lg shadow-red-500/30">
                                    <Phone className="w-5 h-5 mr-2" />
                                    Panggil Ambulans
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

            </div>
        </div >
    );
};

export default DashboardUser;
