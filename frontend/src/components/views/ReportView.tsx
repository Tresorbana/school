import { useState } from "react";
import AbsentListModal from "../modals/reports/AbsentList.modal";
import AllowedRoles from "../shared/AllowedRoles";
import Role from "../../utils/constants";
import SharedHeader from "../shared/SharedHeader";
import ViewHeader from "../shared/ViewHeader";

import AdminReportWidget from "../widgets/report/Admin.widget";
import TeacherReportWidget from "../widgets/report/Teacher.widget";

function ReportView() {
  // Modal state
  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);
  const [selectedPeriod] = useState<string>("");
  const [selectedDay] = useState<string>("");

  return (
    <div className="font-poppins">
      {/* Header */}
      <SharedHeader placeholder="Search reports and analytics" />

      {/* Role-based Report Widgets */}
      <AllowedRoles roles={Role.ADMIN}>
        <div className="m-10">
          <ViewHeader title="Report" />
          <AdminReportWidget />
        </div>
      </AllowedRoles>


      <AllowedRoles roles={Role.TEACHER}>
        <div className="m-10">
          <ViewHeader title="Report" />
          <TeacherReportWidget />
        </div>
      </AllowedRoles>


      {/* Absent List Modal */}
      <AbsentListModal
        open={isAbsentModalOpen}
        onClose={() => setIsAbsentModalOpen(false)}
        day={selectedDay}
        period={selectedPeriod}
        absentStudents={[]}
      />
    </div>
  );
}

export default ReportView;