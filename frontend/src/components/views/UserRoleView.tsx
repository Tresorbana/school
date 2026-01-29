import SharedHeader from "../shared/SharedHeader";
import ViewHeader from "../shared/ViewHeader";
import AllowedRoles from "../shared/AllowedRoles";
import AdminUserManagement from "../widgets/userrole/admin/UserManagement";
import MaintainerUserManagement from "../widgets/userrole/maintainer/UserManagement";
import Role from "../../utils/constants";

function UserRoleView() {
  return (
    <div className="font-poppins">
      <SharedHeader placeholder="Search users and roles" />
      <div className="m-10">
        <ViewHeader title="User & roles" />

        <div className="py-4">
          <AllowedRoles roles={Role.ADMIN}>
            <AdminUserManagement />
          </AllowedRoles>

          <AllowedRoles roles={Role.MAINTAINER}>
            <MaintainerUserManagement />
          </AllowedRoles>
        </div>
      </div>
    </div>
  );
}

export default UserRoleView;
