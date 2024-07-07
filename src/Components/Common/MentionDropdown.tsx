import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

const MentionsDropdown: React.FC<{
  onSelect: (user: any) => void;
  position: { top: number; left: number };
}> = ({ onSelect, position }) => {
  const facilityId = "81092ced-8720-44cb-b4c5-3f0ad0540153";
  const { data } = useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: facilityId },
  });

  const users = data?.results || [];

  return (
    <div
      className="absolute z-10 w-64 rounded-md bg-white shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {users.map((user) => (
        <div
          key={user.id}
          className="cursor-pointer p-2 hover:bg-gray-100"
          onClick={() => onSelect(user)}
        >
          {user.username}
        </div>
      ))}
    </div>
  );
};

export default MentionsDropdown;
