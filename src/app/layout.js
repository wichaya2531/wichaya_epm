import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from './../lib/context/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "e - PM System",
  description: "A project management tool for everyone",
};

export default function RootLayout({ children }) {
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
