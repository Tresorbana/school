import Role from "../../utils/constants";
import TimetableAdminWidget from "../widgets/timetable/Admin.widget";
import TimetableTeacherWidget from "../widgets/timetable/Teacher.widget";
import AllowedRoles from "../shared/AllowedRoles";

function TimetableView() {
  return (
    <>
      <AllowedRoles roles={Role.ADMIN}>
        <TimetableAdminWidget/>
      </AllowedRoles>

      <AllowedRoles roles={Role.TEACHER}>
        <TimetableTeacherWidget/>
      </AllowedRoles>
    </>
  );
}

export default TimetableView;