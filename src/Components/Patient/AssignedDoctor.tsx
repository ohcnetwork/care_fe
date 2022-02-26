import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getUserDetails } from "../../Redux/actions";
const fetchDoctor = async (doctor: any, setUser: any, dispatchAction: any) => {
  const response = await dispatchAction(getUserDetails(doctor.username));
  const userDetails = response.data;
  console.log(userDetails);
  setUser(userDetails);
};
export default function AssignedDoctor(props: any) {
  const { doctor } = props;
  const [user, setUser] = useState<any>(null);
  const dispatchAction: any = useDispatch();

  useEffect(() => {
    fetchDoctor(doctor, setUser, dispatchAction);
  }, [doctor]);
  return (
    <p className="font-bold text-green-800 rounded-lg shadow bg-green-200 p-3 mx-3 flex-1 text-center flex justify-center gap-2">
      <span className="inline">
        Assigned Doctor: {doctor.first_name} {doctor.last_name}
      </span>
      {user && user.alt_phone_number && (
        <a
          href={`https://wa.me/${user.alt_phone_number}`}
          target="_blank"
          rel="noreferrer"
        >
          <i className="fab fa-whatsapp"></i> Video Call
        </a>
      )}
    </p>
  );
}
