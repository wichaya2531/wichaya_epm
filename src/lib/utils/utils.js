"use server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
//import { config } from "@/config/config.js";
//import { connectToDb } from "@/app/api/mongo/index.js";

const secretKey = process.env.SECRET_KEY;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(prevState, formData) {
  //console.log('use login function !!');
  const username = formData.get("username");
  const password = formData.get("password");
  //const host_link=formData.get("host_link");

  //console.log('use function login',process.env.NEXT_PUBLIC_HOST_LINK);
  //console.log("username:"+username);
  //console.log("link:"+host_link);
  //return;

  const res = await fetch(
    process.env.NEXT_PUBLIC_HOST_LINK + `/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    }
  );
  
  const data = await res.json();
  if (data.status === 200) {
    cookies().set("token", data.token, {
      httpOnly: true,
    });
    if (!data.user.Role) {
      return { message: "User is not assigned role." };
    }
    const path = routing(data.user.Role);
    redirect(path);
  } else {
    return { message: "Wrong credential Please try again" };
  }
}

export async function logins(prevState, formData) {
  const username = formData.get("username");
  const password = formData.get("password");
  //const host_link=formData.get("host_link");

  //console.log("username:"+username);
  //console.log("link:"+host_link);
  //return;

  const res = await fetch(
    process.env.NEXT_PUBLIC_HOST_LINK + `/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    }
  );
  const data = await res.json();
  if (data.status === 200) {
    cookies().set("token", data.token, {
      httpOnly: true,
    });
    if (!data.user.Role) {
      return { message: "User is not assigned role." };
    }
    return { success: true, role: data.user.Role };
  } else {
    return { message: "Wrong credential Please try again" };
  }
}

const routing = (role_id) => {
  switch (role_id) {
    case process.env.SA_ROLE_ID:
      return "/pages/SA/create-role";
    default:
      return "/pages/dashboard";
  }
};

// export async function register(prevState, formData) {
//   const empNumber = formData.get("employeeNumber");
//   const empName = formData.get("employeeName");
//   const email = formData.get("email");
//   const username = formData.get("username");
//   const password = formData.get("password");
//   const confirmPassword = formData.get("confirm_password");
//   const team = formData.get("team");

//   if (password !== confirmPassword) {
//     return { message: "Passwords do not match", status: 400 };
//   }

//   const res = await fetch(`${config.host}/api/auth/register`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       emp_number: empNumber,
//       emp_name: empName,
//       email: email,
//       username: username,
//       password: password,
//       team: team,
//     }),
//   });
//   const data = await res.json();

//   if (data.status === 500) {
//     return { message: data.error, status: data.status };
//   } else if (data.status === 400) {
//     return { message: `${data.duplicateField} already exists`, status: data.status };
//   } else {
//     return { message: "User created successfully", status: 200 };
//   }
// }

export async function logout() {
  cookies().set("token", "", { expires: new Date(0) });
}

export async function getSession() {
  //try{
    const session = cookies().get("token")?.value;
    if (!session) return { message: "Session not found" };
    return await decrypt(session);
  //}catch(err){
      
  //}

}

export const generateUniqueKey = async () => {
  const timestamp = Date.now().toString(16);
  const randomSuffix = Math.random().toString(16).substring(2);
  return `${timestamp}-${randomSuffix}`;
};

export const convertKeyToDate = async (uniqueKey) => {
  const [timestampHex, randomSuffix] = uniqueKey.split("-");
  const timestamp = parseInt(timestampHex, 16);
  const date = new Date(timestamp);

  return date;
};

export const getRevisionNo = async (documentNo) => {
  try {
    const res = await fetch(
      //`https://wdcdagilesdk.oracleoutsourcing.com/AgileDocumentViewer/DocAttachmentServlet?&docDesc=&docType=&docCategory=&productName=&businessUnit=&classification=&affectedSite=&affectedAreas=&docOwner=&xmlFlag=searchCriteria&docNum=${documentNo}`
      `https://wdcdagilesdk.oracleoutsourcing.com/AgileDocumentViewer/DocAttachmentServlet?&docNum=${documentNo}&docDesc=&docType=&docCategory=&productName=&businessUnit=&classification=&affectedSite=&affectedAreas=&docOwner=&revReleaseDate=&xmlFlag=searchCriteria`,
      { next: { revalidate: 10 } }
    );
    const data = await res.json();
    //console.log("html tag from agile:=>", data);
    if (data.length > 1) {
      return { message: "Multiple records found" };
    } else if (data.NoRecords) {
      return { message: data.NoRecords };
    }

    return data[0].Revision;
  } catch (err) {
    console.error("Error occurred:", err); // Log the error
    return { message: "Error occurred while fetching data" };
  }
};


export async function sendEmailsFromManual(emailList, job,mode='wait_for_get') {
  //console.log('sendEmailsFromManual mode',mode);
  //return;
   
  //console.log('sendEmailsFromManual ');
  //console.log('emailList ',emailList);
  //console.log('job ',job);
  var subject=''; 
  var mailBody='';
  if(mode==='wait_for_get'){
      subject=`${job.linename} : ${job.name} - CheckList activated `;
      mailBody= `
            You have a new checklist to do. Please check the EPM system for more details.
            Details:
            Checklist Name : ${job.name}
            Job Line  : ${job.linename}
            Activated by: ${job.activatedBy}
            Timeout: ${job.timeout}
            Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
            `;
  }else if (mode=='wait_for_approve') {
      subject=`${job.linename} : ${job.name} - CheckList is Waiting for Approve `;
      mailBody= `
            You have a checklist to Waiting for Approve. Please check the EPM system for more details.
            Details:
            Checklist Name : ${job.name}
            Job Line  : ${job.linename}
            Activated by: ${job.activatedBy}
            Timeout: ${job.timeout}
            Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
            `;    
  }




   if (process.env.WD_INTRANET_MODE === false) {
    console.log("send emailList to=>", emailList);
    return;
  }

   const emailString = emailList.join(",");
  //console.log('job on email sent',job);
  const response = await fetch(
    process.env.NEXT_PUBLIC_HOST_LINK + "/api/emailsentManual",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

     
      body: JSON.stringify({
        email: emailString,
        subject: subject,
        body:mailBody,
        mailsender: "epm-system@wdc.com",
        namesender: "epm-system@wdc.com",
      }),
    }
  );
  
    // try{
    //        await connectToDb();
    //        const _emailStacker = new EmailStack({
    //            EMAIL_SUBJECT: `${job.linename} : ${job.name} - CheckList activated `,
    //            EMAIL_TO:emailString,
    //            EMIAL_SENDER: "epm-system@wdc.com",
    //            EMAIL_CC:'',
    //            EMAIL_BODY:`
    //                     You have a new checklist to do. Please check the EPM system for more details.
    //                     Details:
    //                     Checklist Name : ${job.name}
    //                     Job Line  : ${job.linename}
    //                     Activated by: ${job.activatedBy}
    //                     Timeout: ${job.timeout}
    //                     Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
    //                     `,
    //       });      
    //       //console.log('_emailStacker',_emailStacker);
    //       await _emailStacker.save();
    //       //console.log("บันทึกสำเร็จ");
    // }catch(err){
    //   console.error(err);
    // }
}

export async function sendEmails(emailList, job) {
  // if (process.env.WD_INTRANET_MODE === false) {
  //   console.log("send emailList to=>", emailList);
  //   return;
  // }

  //  const emailString = emailList.join(",");
  // // //console.log('job on email sent',job);
  // // const response = await fetch(
  // //   process.env.NEXT_PUBLIC_HOST_LINK + "/api/emailsent",
  // //   {
  // //     method: "POST",
  // //     headers: {
  // //       "Content-Type": "application/json",
  // //     },

     
  // //     body: JSON.stringify({
  // //       email: emailString,
  // //       subject: `${job.linename} : ${job.name} - CheckList activated `,
  // //       body: `
  // //           You have a new checklist to do. Please check the EPM system for more details.
  // //           Details:
  // //           Checklist Name : ${job.name}
  // //           Job Line  : ${job.linename}
  // //           Activated by: ${job.activatedBy}
  // //           Timeout: ${job.timeout}
  // //           Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
  // //           `,
  // //       mailsender: "epm-system@wdc.com",
  // //       namesender: "epm-system@wdc.com",
  // //     }),
  // //   }
  // // );
  
  //   try{
  //          await connectToDb();
  //          const _emailStacker = new EmailStack({
  //              EMAIL_SUBJECT: `${job.linename} : ${job.name} - CheckList activated `,
  //              EMAIL_TO:emailString,
  //              EMIAL_SENDER: "epm-system@wdc.com",
  //              EMAIL_CC:'',
  //              EMAIL_BODY:`
  //                       You have a new checklist to do. Please check the EPM system for more details.
  //                       Details:
  //                       Checklist Name : ${job.name}
  //                       Job Line  : ${job.linename}
  //                       Activated by: ${job.activatedBy}
  //                       Timeout: ${job.timeout}
  //                       Direct link : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/login
  //                       `,
  //         });      
  //         //console.log('_emailStacker',_emailStacker);
  //         await _emailStacker.save();
  //         //console.log("บันทึกสำเร็จ");
  //   }catch(err){
  //     console.error(err);
  //   }


}

export async function sendResetEmail(information, token) {
  if (!Array.isArray(information)) {
    console.error("Invalid information provided:", information);
    return;
  }

  const body = `
    We have found ${
      information.length
    } users with the email address you provided.

    ${information
      .map(
        (info, index) => `
      Employee Number: ${info.emp_number}
      Employee Name: ${info.emp_name}
      Email: ${info.email}
      Workgroup: ${info.workgroup}
      Username: ${info.username}
      Reset Link: ${process.env.NEXT_PUBLIC_HOST_LINK}/pages${info.reset_link}
    `
      )
      .join("")}
  `;

  const usrsparams = new URLSearchParams({
    subject: "Password Reset",
    body: body,
    mailsender: "epm-system@wdc.com",
    cc: "",
    namesender: "epm-system@wdc.com",
  });

  const emails = information.map((info) => info.email);
  const emailString = emails.join(","); // Join emails with a comma separator
  /*
  usrsparams.set("mailto", emailString);

  console.log("Sending emails to:", emailString);

  const response = await fetch(
    `http://172.17.70.201/tme/api/email_send.php?${usrsparams.toString()}`
  );

  if (response.ok) {
    console.log("Emails sent successfully");
  } else {
    console.error("Failed to send emails", response.statusText);
  }

  const emailString = emailList.join(",");
*/
  const response = await fetch(
    process.env.NEXT_PUBLIC_HOST_LINK + "/api/emailsent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailString,
        subject: "Password Reset",
        body: body,
        mailsender: "epm-system@wdc.com",
        namesender: "epm-system@wdc.com",
      }),
    }
  );
}
