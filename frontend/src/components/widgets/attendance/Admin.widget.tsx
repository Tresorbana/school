import { useEffect, useMemo, useState } from "react";
import { HiClipboardCheck, HiClock, HiExclamation, HiShieldCheck } from "react-icons/hi";
import { ReviewCards } from "../../cards/Dashboard.cards";
import ViewHeader from "../../shared/ViewHeader";
import ModalWrapper from "../../shared/ModalWrapper";
import { apiClient } from "../../../utils/apiClient";
import { useToast } from "../../../utils/context/ToastContext";
import { useAuth } from "../../../utils/context/AuthContext";

type PermissionRequest = {
  request_id?: string;
  status?: string;
  created_at?: string;
  period_date?: string;
  class_name?: string;
  teacher_name?: string;
  teacher_email?: string;
  period?: number;
  day_of_week?: string;
  reason?: string;
  reason_category?: string;
  reason_notes?: string;
};

const toDateString = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

function AttendanceAdminWidget() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);


  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/attendance/permission-requests");
      console.log("[AttendanceAdminWidget] permission-requests response", response);
      if (response?.success || response?.status === "success") {
        const payload = response.data ?? response;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : payload?.requests ?? payload?.data?.requests;
        console.log("[AttendanceAdminWidget] parsed permission requests", items);
        setRequests(items || []);
      } else {
        console.log("[AttendanceAdminWidget] permission-requests response not successful", response);
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to load permission requests:", error);
      addToast({
        message: "Failed to load attendance permission requests",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedRequest(null);
    setShowDenyConfirm(false);
  };

  const updateRequestStatus = async (requestId: string, action: "approve" | "deny") => {
    if (!user?.id) {
      addToast({ message: "Admin user not found", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const endpoint = action === "approve"
        ? "/api/attendance/approve-permission-request"
        : "/api/attendance/deny-permission-request";

      const response = await apiClient.post(endpoint, {
        request_id: requestId,
        admin_id: user.id
      });

      if (response?.success || response?.status === "success") {
        addToast({ message: `Request ${action}d`, type: "success" });
        await loadRequests();
      } else {
        addToast({ message: response?.message || `Failed to ${action} request`, type: "error" });
      }
    } catch (error) {
      addToast({ message: error instanceof Error ? error.message : `Failed to ${action} request`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const stats = useMemo(() => {
    const base = { pending: 0, approved: 0, denied: 0, expired: 0 };
    requests.forEach((request) => {
      const status = request.status?.toLowerCase();
      if (status === "approved") base.approved += 1;
      else if (status === "denied") base.denied += 1;
      else if (status === "expired") base.expired += 1;
      else base.pending += 1;
    });
    return base;
  }, [requests]);

  const cards = [
    {
      title: "Pending requests",
      date: "Today",
      numbers: stats.pending.toString(),
      comment: "Waiting for admin review",
      icon: <HiClock />
    },
    {
      title: "Approved",
      date: "Today",
      numbers: stats.approved.toString(),
      comment: "Late attendance allowed",
      icon: <HiShieldCheck />
    },
    {
      title: "Denied",
      date: "Today",
      numbers: stats.denied.toString(),
      comment: "Requests rejected",
      icon: <HiExclamation />
    },
    {
      title: "Expired",
      date: "Today",
      numbers: stats.expired.toString(),
      comment: "Requests older than 2 days",
      icon: <HiClipboardCheck />
    }
  ];

  const pendingRequests = requests.filter((request) => {
    const status = request.status?.toLowerCase();
    return !status || status === "pending";
  });

  const formatReason = (request: PermissionRequest) => {
    if (request.reason_notes) return request.reason_notes;
    if (request.reason_category) return request.reason_category.replace(/_/g, " ");
    if (request.reason) return request.reason;
    return "Reason not provided";
  };

  return (
    <div className="font-poppins">
      <div className="m-10 my-4">
        <ViewHeader title="Attendance" customDescription="Review late attendance permission requests and monitor approval activity." />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card) => (
            <ReviewCards
              key={card.title}
              title={card.title}
              date={card.date}
              numbers={card.numbers}
              comment={card.comment}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[0.98rem]">Pending permission requests</h3>
              <p className="text-xs text-gray-500">Approve or deny late attendance requests.</p>
            </div>
            <button
              type="button"
              onClick={loadRequests}
              className="text-xs font-semibold text-main hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading requests...</p>
          ) : pendingRequests.length ? (
            <div className="divide-y divide-gray-200">
              {pendingRequests.slice(0, 6).map((request) => (
                <div key={request.request_id || request.created_at} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {request.class_name || "Class"} • {request.teacher_name || "Requester"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatReason(request)} · {toDateString(request.period_date || request.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="text-xs font-semibold text-main hover:text-main/80"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pending permission requests right now.</p>
          )}
        </div>
      </div>
      <ModalWrapper
        isOpen={!!selectedRequest}
        onClose={closeDetailModal}
        className="w-full max-w-lg"
        preventClose={loading}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Permission request details</h3>
              <p className="text-xs text-gray-500">Review the request before approving or denying.</p>
            </div>
            <button
              type="button"
              onClick={closeDetailModal}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              Close
            </button>
          </div>

          {selectedRequest && (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Teacher</p>
                  <p className="font-medium">{selectedRequest.teacher_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedRequest.teacher_email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium">{selectedRequest.class_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">{toDateString(selectedRequest.period_date || selectedRequest.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Period</p>
                  <p className="font-medium">
                    {selectedRequest.period ? `Period ${selectedRequest.period}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Day</p>
                  <p className="font-medium">{selectedRequest.day_of_week || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Reason</p>
                <p className="font-medium">{formatReason(selectedRequest)}</p>
              </div>
              {selectedRequest.reason_category && (
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium">{selectedRequest.reason_category.replace(/_/g, " ")}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDenyConfirm(true)}
              disabled={loading || !selectedRequest?.request_id}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Deny
            </button>
            <button
              type="button"
              onClick={() => selectedRequest?.request_id && updateRequestStatus(selectedRequest.request_id, "approve")}
              disabled={loading || !selectedRequest?.request_id}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        isOpen={showDenyConfirm}
        onClose={() => setShowDenyConfirm(false)}
        className="w-full max-w-sm"
        preventClose={loading}
      >
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Confirm denial</h3>
            <p className="text-xs text-gray-500 mt-1">
              Denying this request will block the teacher from submitting another permission request for the same period.
              And the attendance will not be done for this period ever.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDenyConfirm(false)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => selectedRequest?.request_id && updateRequestStatus(selectedRequest.request_id, "deny")}
              disabled={loading || !selectedRequest?.request_id}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Deny request
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
}

export default AttendanceAdminWidget;
