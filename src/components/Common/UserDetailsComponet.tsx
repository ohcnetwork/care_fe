import UserDetails from "@/components/Common/UserDetails";

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
      <div className="overflow-hidden">
        <div className="truncate font-semibold" title={value}>
          {value}
        </div>
      </div>
    </UserDetails>
  </div>
);

export default UserDetailComponent;
