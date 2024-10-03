'use client'
import Layout from "@/components/Layout.js";
import { config } from "@/config/config.js";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchTestLocations from "@/lib/hooks/useFetchTestLocations";
import Select from 'react-select';
import { useState } from "react";
import Link from "next/link";
import useFetchJobItemTemplate from "@/lib/hooks/useFetchJobItemTemplate";
import Swal from "sweetalert2";




const Page = ({searchParams}) => {
    const jobTemplate_id = searchParams.jobTemplate_id
    const jobItemTemplate_id = searchParams.jobItemTemplate_id
    const [refresh, setRefresh] = useState(false);
    const { jobItemTemplate, isLoading: jobItemTemplateLoading } = useFetchJobItemTemplate(jobItemTemplate_id, refresh);
    const { user, isLoading: userLoading } = useFetchUser(refresh);
    const { locations, isLoading: locationsLoading } = useFetchTestLocations(refresh);


    const HandleSubmit = async (e) => {
        
        //if test location is not selected
        e.preventDefault();
        if (!e.target.test_location.value) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please select a test location!',
            });
            return;
        }
        
       
        const form = new FormData(e.target);
        const data = {
            jobTemplate_id,
            jobItemTemplate_id,
            author: user._id,
            job_item_template_title: form.get("job_item_template_title"),
            job_item_template_name: form.get("job_item_template_name"),
            upper_spec: form.get("upper_spec"),
            lower_spec: form.get("lower_spec"),
            test_method: form.get("test_method"),
            test_location: form.get("test_location"),
        };

        try {
            const res = await fetch(`/api/job-item-template/edit-job-item-template`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
                next : { revalidate: 10 }
            });
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Checklist Item Template Updated Successfully!',
                });
                setRefresh(!refresh);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Something went wrong!',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong!',
            });
        }
    };

   
    return (
        <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-7">
        <div className="flex flex-row justify-between items-center">
            <div className="flex flex-col gap-3">
                <h1 className="text-2xl font-bold text-primary flex  items-center">{">"} {jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE} </h1>
                <h1 className="text-1xl font-semibold">Edit Item to Checklist Template</h1>
            </div>
            <Link 
                 href={{
                    pathname: "/pages/job-item-template/add-job-item-template/",
                    query: { jobTemplate_id: jobTemplate_id }
                 }}

                 className="text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center bg-red-500 hover:bg-red-800"
                 >
                    Return to Checklist Item Template
            </Link>
        </div>
            <form onSubmit={HandleSubmit}>
                <div className="grid gap-6 mb-6 md:grid-cols-3">
                    <div>
                        <label
                            for="author"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Author
                        </label>
                        <input
                            type="text"
                            id="author"
                            className="bg-gray-200 border cursor-not-allowed border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50  "
                            value={user.name || ""}
                            disabled
                            name="author"
                            required
                        />
                    </div>
                    <div>
                        <label
                            for="job_item_template_title"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Checklist Item Template Title
                        </label>
                        <input
                            type="text"
                            id="job_item_template_title"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="title"
                            defaultValue={jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE || ""}
                            name="job_item_template_title"
                            required
                        />
                    </div>
                    <div>
                        <label
                            for="job_item_template_name"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Checklist Item Template Name
                        </label>
                        <input
                            type="text"
                            id="job_item_template_name"
                            placeholder="name"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            defaultValue={jobItemTemplate.JOB_ITEM_TEMPLATE_NAME || ""}
                            name="job_item_template_name"
                            required
                        />
                    </div>
                    <div>
                        <label
                            for="Upper_Spec"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Upper Spec
                        </label>
                        <input
                            type="text"
                            id="upper_spec"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            defaultValue={jobItemTemplate.UPPER_SPEC || ""}
                            name="upper_spec"
                            required
                        />
                    </div>
                    <div>
                        <label
                            for="lower_spec"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Lower Spec
                        </label>
                        <input
                            type="text"
                            id="lower_spec"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"                           
                            defaultValue={jobItemTemplate.LOWER_SPEC || ""}
                            name="lower_spec"
                            required
                        />
                    </div>
                    <div>
                        <label
                            for="test_method"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Test Method
                        </label>
                        <input
                            type="text"
                            id="test_method"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            defaultValue={jobItemTemplate.TEST_METHOD || ""}
                            name="test_method"
                            required
                        />
                    </div>
                    <div>
                        <label
                            for="test_method"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Test location
                        </label>
                        <Select name="test_location" id="test_location" className=" text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full "
                            options={
                                locations.map(location => {
                                    return {
                                        value: location._id,
                                        label: location.LocationName
                                    }
                                })
                            }
                            isSearchable={true}
                        />
                    </div>

                </div>
                <button
                    type="submit"
                    className={`text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center bg-primary hover:bg-primary-dark`}
            
                >
                    Save Checklist Item Template
                </button>
                
            </form>

        </Layout>

    );
};

export default Page;