import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from './../lib/context/AuthContext';


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "e - PM System",
  description: "A project management tool for everyone",
  developper:"default"  
};


export default function RootLayout({ children }) {
  //console.log(process.env.DEVELOPPER);
  metadata.title="e - PM System : "+process.env.SITE_TITLE;
  return (
    //src="/assets/images/login-logo.png"   
      <html lang="en">        
        <link rel="icon" href="/assets/images/e_pm-Icon.ico" />
        <AuthContextProvider>
          <body className={inter.className}>
              <div  id="md-data-developper" style={{display:"none"}} >{process.env.DEVELOPPER}</div>
              <div  id="md-data-host" style={{display:"none"}} >{process.env.HOST}</div>
              <div  id="md-data-host_link" style={{display:"none"}} >{process.env.HOST_LINK}</div>
              {children}
            
          </body>
        </AuthContextProvider>
      </html>
  
  );
}
