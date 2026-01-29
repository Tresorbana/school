import SharedHeader from "../shared/SharedHeader";
import AllowedRoles from "../shared/AllowedRoles";
import Role from "../../utils/constants";
import AttendanceAdminWidget from "../widgets/attendance/Admin.widget";

function AttendanceView() {
  return (
    <div>
      <div className="font-poppins">
        <SharedHeader placeholder="Search attendance records" />


        <AllowedRoles roles={Role.ADMIN}>
          <AttendanceAdminWidget />
        </AllowedRoles>
      </div>
    </div>
  );
}

export default AttendanceView;