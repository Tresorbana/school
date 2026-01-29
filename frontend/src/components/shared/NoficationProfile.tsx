import { useAuth } from "../../utils/context/AuthContext";
import AvatarLetter from "./AvatarLetter";
import NotificationBell from "./NotificationBell";

function NoficationProfile() {
  const { user } = useAuth();

  return (
    <div className="hidden md:flex items-center gap-10 mr-10 justify-evenly">
      {/** notifications */}
      <NotificationBell />
      
      {/* profile */}
      <div className="flex items-center gap-2">
        <AvatarLetter 
          size={30} 
          firstname={user?.first_name}
          lastname={user?.last_name}
          email={user?.email}
        />
        <p className="font-poppins">{user?.first_name + ' ' + user?.last_name}</p>
      </div>
    </div>
  )
}

export default NoficationProfile;