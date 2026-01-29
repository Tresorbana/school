import type { JSX } from "react";
import { useState, useEffect } from "react";
import ViewHeader from "../shared/ViewHeader";
import { FiDollarSign, FiPlus, FiAlertCircle, FiSearch, FiPrinter, FiBarChart2 } from "react-icons/fi";
import { feeService } from "../../services/feeService";
import type { FeeSummary, Defaulter } from "../../services/feeService";
import { useToast } from "../../utils/context/ToastContext";

function FeesView(): JSX.Element {
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'defaulters'>('overview');
    console.log(setActiveTab); // Placeholder to avoid unused var warning if logic expands
    const [summary, setSummary] = useState<FeeSummary | null>(null);
    const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        if (activeTab === 'defaulters') {
            fetchDefaulters();
        }
    }, [activeTab]);

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const response = await feeService.getFeeSummary();
            if (response.success) {
                setSummary(response.data);
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to load fee summary' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDefaulters = async () => {
        setIsLoading(true);
        try {
            const response = await feeService.getDefaulters();
            if (response.success) {
                setDefaulters(response.data);
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to load defaulters list' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#f0f2f5] text-slate-800">
            <ViewHeader
                title="School Fees Management"
                description="Track payments, manage defaulters, and view financial summaries"
                rightElement={
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-main text-white px-4 py-2 rounded-lg hover:bg-main-hover transition-colors">
                            <FiPlus />
                            <span>Record Payment</span>
                        </button>
                        <button className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <FiPrinter />
                            <span>Report</span>
                        </button>
                    </div>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Collected</p>
                            <h3 className="text-2xl font-bold text-accent-green mt-1">
                                RWF {summary?.total_collected?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-accent-green">
                            <FiDollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">Total received this year</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Outstanding</p>
                            <h3 className="text-2xl font-bold text-red-500 mt-1">
                                RWF {summary?.outstanding_balance?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-red-500">
                            <FiAlertCircle size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">Unpaid student fees</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Collection Rate</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">
                                {summary?.collection_rate || 0}%
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <FiBarChart2 size={20} />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${summary?.collection_rate || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Expected Total</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                RWF {summary?.total_expected?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                            <FiDollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">Projected yearly revenue</div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
                            ? 'border-main text-main'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Recent Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('defaulters')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'defaulters'
                            ? 'border-main text-main'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Defaulters List
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                            <div className="bg-slate-50 p-4 rounded-full mb-4">
                                <FiSearch size={24} className="text-slate-400" />
                            </div>
                            <p className="font-medium">No recent transactions found</p>
                            <p className="text-sm mt-1 text-slate-400">Record a payment to see it appear here</p>
                        </div>
                    )}

                    {activeTab === 'defaulters' && (
                        <div className="flex flex-col">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-500">Loading defaulters...</div>
                            ) : defaulters.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase bg-slate-50/50">
                                            <th className="p-4 font-medium">Student</th>
                                            <th className="p-4 font-medium">Class</th>
                                            <th className="p-4 font-medium text-right">Total Paid</th>
                                            <th className="p-4 font-medium text-right">Balance</th>
                                            <th className="p-4 font-medium text-right">Days Overdue</th>
                                            <th className="p-4 font-medium text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {defaulters.map((student) => (
                                            <tr key={student.student_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-medium text-slate-700">{student.student_name}</td>
                                                <td className="p-4 text-slate-600">{student.class_name}</td>
                                                <td className="p-4 text-right text-slate-600">RWF {student.total_paid.toLocaleString()}</td>
                                                <td className="p-4 text-right font-medium text-red-500">RWF {student.balance.toLocaleString()}</td>
                                                <td className="p-4 text-right text-slate-600">{student.days_overdue} days</td>
                                                <td className="p-4 text-center">
                                                    <button className="text-xs font-medium text-main hover:underline bg-slate-100 px-3 py-1.5 rounded-full">
                                                        Reminder
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                    <div className="bg-green-50 p-4 rounded-full mb-4">
                                        <FiDollarSign size={24} className="text-green-500" />
                                    </div>
                                    <p className="font-medium text-slate-700">All fees collected!</p>
                                    <p className="text-sm mt-1 text-slate-400">No overdue payments found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export default FeesView;
