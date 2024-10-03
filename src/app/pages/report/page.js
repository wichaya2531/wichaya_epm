import Layout from "@/components/Layout";
import BarChart from "./BarChart";
import Image from "next/image";

const Page = () => {
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/card-logo/report.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Report
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Summarize the data.
        </h1>
      </div>
      <BarChart />
    </Layout>
  );
};

export default Page;
