"use client";
import Layout from "@/components/Layout";
import React, { useEffect, useState } from "react";
import Image from "next/image";

const Page = () => {
  return (
    <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
      <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white ">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/card-logo/help.png"
            alt="wd logo"
            width={50}
            height={50}
          />
          <h1 className="text-3xl font-bold text-slate-900">
            ChecklistPM-Help
          </h1>
        </div>
        <h1 className="text-sm font-bold text-secondary flex  items-center">
          Contact admin, need help.
        </h1>
      </div>
    </Layout>
  );
};

export default Page;
