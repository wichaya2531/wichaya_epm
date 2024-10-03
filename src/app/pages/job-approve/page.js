"use client";
import Layout from "@/components/Layout";
import TableComponent from "@/components/TableComponent";
import useFetchJobApproves from "@/lib/hooks/useFetchJobApproves";
import useFetchUser from "@/lib/hooks/useFetchUser";
import Link from "next/link";
import Image from "next/image";

const jobApprovesHeader = [
  "ID",
  "Checklist Name",
  //"Document no.",
  "Line Name",
  "Status",
  "submittedAt",
  "Action",
];
//console.log("jobApprovesHeader_xxx..");
const Page = () => {
  const { user, isLoading: userLoading, error: userError } = useFetchUser();
  const {
    jobApproves,
    loading: jobApprovesLoading,
    error: jobApprovesError,
  } = useFetchJobApproves(user._id);

  //console.log("jobApproves", jobApproves);
  const jobApprovesBody =
    jobApproves &&
    jobApproves.map((jobApprove, index) => {
      return {
        ID: index + 1,
        "Checklist Name": jobApprove.job_name,
        //"Document no.": jobApprove.job_doc_number,
        "Line Name": jobApprove.job_line_name,
        Status: (
          <div
            style={{ backgroundColor: jobApprove.job_status_color }}
            className="py-1 px-2 rounded-full text-black font-bold shadow-xl text-[12px] ipadmini:text-sm"
          >
            {jobApprove.job_status ? jobApprove.job_status : "pending"}
          </div>
        ),
        submittedAt: new Date(jobApprove.job_submittedAt).toLocaleString(),
        Action: (
          <div>
            <Link
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none font-bold rounded-lg text-[12px] ipadmini:text-sm px-5 py-2 text-center"
              href={{
                pathname: "/pages/job-review",
                query: {
                  job_id: jobApprove.job_id,
                },
              }}
            >
              View
            </Link>
          </div>
        ),
      };
    });
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 ">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/card-logo/approve.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Approval
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Approve/Disapprove Checklist.
        </h1>
      </div>
      <h1 className="text-md font-bold text-secondary flex  items-center">
        There are {jobApproves.length} submitted jobs, that you need to be
        reviewed.
      </h1>
      <hr className="border-gray-300 mt-4" />
      <TableComponent
        headers={jobApprovesHeader}
        datas={jobApprovesBody}
        TableName="Active Jobs"
        PageSize={5}
      />
    </Layout>
  );
};

export default Page;
