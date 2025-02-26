import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "./../lib/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "e - PM System",
  description: "A project management tool for everyone",
  developer: "default",
};

export default function RootLayout({ children }) {
  //console.log(process.env.DEVELOPER);
  metadata.title = "e - PM System : " + process.env.NEXT_PUBLIC_SITE_TITLE;
  return (
    //src="/assets/images/login-logo.png"
    <html lang="en">
      <link rel="icon" href="/assets/images/e_pm-Icon.ico" />
      <AuthContextProvider>
        <body className={inter.className}>{children}</body>
      </AuthContextProvider>
    </html>
  );
}
