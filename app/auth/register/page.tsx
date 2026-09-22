import { Metadata } from "next";
import RegisterView from "../../../components/auth/RegisterView";

export const metadata: Metadata = {
  title: "Daftar Akun | RuanginAja Coworking Space",
  description:
    "Daftar akun Member untuk booking ruangan atau akun Admin Pengelola Coworking Space di RuanginAja.",
};

export default function RegisterPage() {
  return <RegisterView initialRole="member" />;
}
