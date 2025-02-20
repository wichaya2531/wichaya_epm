"use server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config/config.js";
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
  const username = formData.get("username");
  const password = formData.get("password");

  //console.log("Login credentials:", username);
  //console.log("config.host:", config.host);
  //console.log("config:", config);
  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST_LINK}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
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

const routing = (role_id) => {
  switch (role_id) {
    case process.env.SA_ROLE_ID:
      return "/pages/SA/create-role";
    default:
      return "/pages/dashboard";
  }
};

export async function logout() {
  cookies().set("token", "", { expires: new Date(0) });
}

export async function getSession() {
  const session = cookies().get("token")?.value;
  if (!session) return { message: "Session not found" };
  return await decrypt(session);
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
      `https://wdcdagilesdk.oracleoutsourcing.com/AgileDocumentViewer/DocAttachmentServlet?&docNum=${documentNo}&docDesc=&docType=&docCategory=&productName=&businessUnit=&classification=&affectedSite=&affectedAreas=&docOwner=&revReleaseDate=&xmlFlag=searchCriteria`,
      { next: { revalidate: 10 } }
    );
    const data = await res.json();
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

export async function sendEmailsOverdude(emailList, job) {
  if (process.env.WD_INTRANET_MODE === false) {
    console.log("send emailList to...=>", emailList);
    return;
  }
  //console.log("-- job",job);
  const usrsparams = new URLSearchParams({
    subject: "Notification: Overdue Task Alert",
    body: `
      Dear User,

      The following task is currently overdue. Please review the details below and take the necessary actions:
      
      **Task Details:**
      - Checklist name: ${job.JOB_NAME}
      - DOC_NUMBER : ${job.DOC_NUMBER}
      - Activate Time : ${job.createdAt} 
      - Timeout: ${job.TIMEOUT}

      You can access the task directly using the link below:
      Click for Acknowledge  : ${process.env.NEXT_PUBLIC_HOST_LINK}/pages/acknowledge/${job._id}
      `,
    mailsender: "epm-system@wdc.com",
    cc: "",
    namesender: "epm-system@wdc.com",
  });

  const emailString = emailList.join(",");
  usrsparams.set("mailto", emailString);
  console.log("Sending emails to:", emailString);

  const response = await fetch(
    `http://172.17.70.201/tme/api/email_send.php?${usrsparams}`
  );

  if (response.ok) {
    console.log("Emails sent successfully");
  } else {
    console.error("Failed to send emails", response.statusText);
  }
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
}
