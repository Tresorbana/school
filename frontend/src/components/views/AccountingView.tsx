import type { JSX } from "react";
import { useState, useEffect } from "react";
import ViewHeader from "../shared/ViewHeader";
import { FiTrendingUp, FiTrendingDown, FiPieChart, FiDollarSign, FiPlus } from "react-icons/fi";
import { financialService } from "../../services/financialService";
import type { FinancialSummary, Transaction } from "../../services/financialService";
import { useToast } from "../../utils/context/ToastContext";

function AccountingView(): JSX.Element {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await financialService.getFinancialSummary();
            if (response.success) {
                setSummary(response.data);
                // If the summary includes recent transactions, use those, otherwise fetch separately
                if (response.data.recent_transactions) {
                    setTransactions(response.data.recent_transactions);
                } else {
                    // Fallback or separate call if needed, for now assuming summary has it as per interface
                    const txResponse = await financialService.getTransactions();
                    if (txResponse.success) setTransactions(txResponse.data);
                }
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to load financial data' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#f0f2f5] text-slate-800">
            <ViewHeader
                title="Financial Accounting"
                description="Monitor school income, expenses, and overall financial health"
                rightElement={
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-main text-white px-4 py-2 rounded-lg hover:bg-main-hover transition-colors">
                            <FiPlus />
                            <span>New Transaction</span>
                        </button>
                    </div>
                }
            />

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Income</p>
                            <h3 className="text-2xl font-bold text-accent-green mt-1">
                                RWF {summary?.total_income?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-accent-green">
                            <FiTrendingUp size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">All revenue sources</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Expenses</p>
                            <h3 className="text-2xl font-bold text-red-500 mt-1">
                                RWF {summary?.total_expense?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-red-500">
                            <FiTrendingDown size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">Operational costs</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Net Balance</p>
                            <h3 className={`text-2xl font-bold mt-1 ${(summary?.net_balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                RWF {summary?.net_balance?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <FiDollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">Available funds</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transaction History */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">Recent Transactions</h3>
                        <button className="text-sm text-main hover:underline">View All</button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading transactions...</div>
                        ) : transactions.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase sticky top-0">
                                    <tr>
                                        <th className="p-4 font-medium">Description</th>
                                        <th className="p-4 font-medium">Category</th>
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.transaction_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-medium text-slate-700">{tx.description}</td>
                                            <td className="p-4 text-slate-500 text-sm">
                                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{tx.category}</span>
                                            </td>
                                            <td className="p-4 text-slate-500 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className={`p-4 text-right font-medium ${tx.type === 'income' ? 'text-accent-green' : 'text-red-500'
                                                }`}>
                                                {tx.type === 'income' ? '+' : '-'}RWF {tx.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <div className="bg-slate-50 p-4 rounded-full mb-4">
                                    <FiTrendingUp size={24} className="text-slate-300" />
                                </div>
                                <p>No transactions recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Categories (Placeholder) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <FiPieChart className="text-purple-500" />
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                                Generate Monthly Report
                            </button>
                            <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                                Export Data to CSV
                            </button>
                            <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                                Budget Planning
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto bg-main/5 p-4 rounded-lg border border-main/10">
                        <h4 className="font-semibold text-main text-sm mb-2">Did you know?</h4>
                        <p className="text-xs text-slate-600">
                            Tracking categorical expenses helps reduce operational costs by up to 15% annually.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountingView;
