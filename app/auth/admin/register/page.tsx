import { Metadata } from "next";
import RegisterView from "../../../../components/auth/RegisterView";

export const metadata: Metadata = {
  title: "Daftar Admin Coworking Space | RuanginAja",
  description:
    "Daftarkan lokasi coworking space Anda untuk membuka reservasi dan kelola operasional dengan RuanginAja.",
};

export default function AdminRegisterPage() {
  return <RegisterView initialRole="admin" />;
}
