import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import AdminDashboard from "../adminDashboard/admindashboard";
import StudentDashboard from "../dashboard/studentdashboard";
import StaffDashboard from "../staffDashboard/staffdashboard";

export default function Home() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("auth_role");
      setRole(storedRole);
    };
    loadRole();
  }, []);

  return (
    <>
      {role === "ADMIN" && <AdminDashboard />}
      {role === "PARENT" && <StudentDashboard />}
      {role === "STAFF"  && <StaffDashboard />}
    </>
  );
}

