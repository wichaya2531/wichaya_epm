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
    <html lang="en">
      <AuthContextProvider>
        <body className={inter.className}>{children}</body>
      </AuthContextProvider>
    </html>
  );
}
