import type { JSX } from "react";
import { useState, useEffect } from "react";
import ViewHeader from "../shared/ViewHeader";
import { FiSettings, FiCheckCircle, FiFileText, FiDownload } from "react-icons/fi";
import { deliberationService } from "../../services/deliberationService";
import type { DeliberationRule } from "../../services/deliberationService";
import { useToast } from "../../utils/context/ToastContext";

function DeliberationView(): JSX.Element {
    const [rules, setRules] = useState<DeliberationRule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const response = await deliberationService.getRules();
            if (response.success) {
                setRules(response.data);
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to load deliberation rules' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#f0f2f5] text-slate-800">
            <ViewHeader
                title="Automatic Deliberation"
                description="Configure promotion rules and generate student report cards automatically"
                rightElement={
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-main text-white px-4 py-2 rounded-lg hover:bg-main-hover transition-colors">
                            <FiSettings />
                            <span>Configure Rules</span>
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rules Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                        <FiCheckCircle className="text-accent-green" />
                        Promotion Rules
                    </h3>

                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            <div className="text-center py-6 text-slate-500">Loading rules...</div>
                        ) : rules.length > 0 ? (
                            rules.map((rule) => (
                                <div key={rule.rule_id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-slate-800">{rule.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${rule.promotion_decision === 'promote' ? 'bg-green-100 text-green-700' :
                                            rule.promotion_decision === 'repeat' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {rule.promotion_decision.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">{rule.description}</p>
                                    <div className="mt-2 text-xs text-slate-500 flex gap-4">
                                        <span>Min Avg: {rule.min_average}%</span>
                                        <span>Max Failures: {rule.allowed_failures}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border-dashed border-2 border-slate-200">
                                <p>No rules configured</p>
                                <button className="text-main text-sm font-medium mt-2 hover:underline">
                                    Create Default Rules
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                            <FiFileText className="text-blue-500" />
                            Generate Reports
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Process results for a specific class to generate term reports and promotion decisions based on the configured rules.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-main focus:border-main outline-none">
                                <option value="">Select Academic Year...</option>
                                <option value="2024-2025">2024-2025</option>
                            </select>
                            <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-main focus:border-main outline-none">
                                <option value="">Select Class...</option>
                                <option value="S1-A">Senior 1 A</option>
                                <option value="S4-MCB">Senior 4 MCB</option>
                            </select>

                            <button className="w-full bg-main text-white py-3 rounded-lg font-medium hover:bg-main-hover transition-all mt-2 shadow-lg shadow-main/20">
                                Run Deliberation Process
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Recent Reports</h4>
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex justify-between items-center p-3 text-sm bg-slate-50 rounded-md">
                                    <span className="text-slate-600">Term {i} Reports - S6 PCB</span>
                                    <button className="text-main hover:text-main-hover p-1">
                                        <FiDownload />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeliberationView;
