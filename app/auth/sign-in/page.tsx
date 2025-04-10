import SignIn from "@/src/components/auth/sign-in";
import { isAuthenticated } from "@/src/server/auth/is-authenticated";
import { redirect } from "next/navigation";

const Page: React.FC = async () => {
  const validSession = await isAuthenticated();

  if (validSession) {
    return redirect("/dashboard");
  } else {
    return <SignIn particle="In" />;
  }
};

export default Page;
