import { redirect } from "next/navigation";

// Signed-in users land on their role's dashboard. Only the farmer side exists so far.
export default function Dashboard() {
  redirect("/dashboard/farmer");
}
