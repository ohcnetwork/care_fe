import UserDetails from "./UserDetails";

const UserDetailComponent = ({
  id,
  title,
  value,
}: {
  id: string;
  title: string;
  value: string;
}) => (
  <div className="col-span-1">
    <UserDetails id={id} title={title}>
      <div
        className="overflow-hidden font-semibold"
        style={{ textOverflow: "ellipsis" }}
        title={value}
      >
        {value}
      </div>
    </UserDetails>
  </div>
);

export default UserDetailComponent;
