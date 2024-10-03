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

  console.log("Login credentials:", username);
  console.log("config.host:", config.host);
  const res = await fetch(`${config.host}/api/auth/login`, {
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
      `https://wdcdagilesdk.oracleoutsourcing.com/AgileDocumentViewer/DocAttachmentServlet?&docDesc=&docType=&docCategory=&productName=&businessUnit=&classification=&affectedSite=&affectedAreas=&docOwner=&xmlFlag=searchCriteria&docNum=${documentNo}`,
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

export async function sendEmails(emailList, job) {
  const usrsparams = new URLSearchParams({
    subject: "New CheckList Checklist activated",
    body: `
      You have a new checklist to do.
      Please check the EPM system for more details.
      Details:
      name: ${job.name}
      activated by: ${job.activatedBy}
      timeout: ${job.timeout}
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
      Reset Link: ${config.host}/pages${info.reset_link}
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
