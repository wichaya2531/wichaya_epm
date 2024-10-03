'use client'
import Layout from "@/components/Layout.js";
import TableComponent from "@/components/TableComponent.js";
import { config } from "@/config/config.js";
import useFetchJobItemTemplates from "@/lib/hooks/useFetchJobItemTemplates";
import useFetchUser from "@/lib/hooks/useFetchUser";
import useFetchJobTemplate from "@/lib/hooks/useFetchJobTemplate";
import useFetchTestLocations from "@/lib/hooks/useFetchTestLocations";
import Select from 'react-select';
import { useState } from "react";
import Link from "next/link";

import Image from "next/image";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";


const jobItemTemplateHeader = ["ID", "Title", "Upper Spec", "Lower Spec", "Test Method", "Create At", "Action"];
const enabledFunction = {
    "add-job-item-template": "6638600dd81a314967236df5",
    "remove-job-item-template": "66386025d81a314967236df7",
};

const Page = ({ searchParams }) => {
    const jobTemplate_id = searchParams.jobTemplate_id
    const [refresh, setRefresh] = useState(false);
    const { jobItemTemplates, isLoading: jobItemTemplatesLoading } = useFetchJobItemTemplates(jobTemplate_id, refresh);
    const { user, isLoading: userLoading } = useFetchUser(refresh);
    const { jobTemplate, isLoading: jobTemplateLoading } = useFetchJobTemplate(jobTemplate_id, refresh);
    const { locations, isLoading: locationsLoading } = useFetchTestLocations(refresh);

    const [selectedFile, setSelectedFile] = useState(null);

    const onDrop = (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: "image/*",
    });

    const jobItemTemplateBody = jobItemTemplates.map((jobItemTemplate, index) => {
        return {
            ID: index + 1,
            Title: jobItemTemplate.JOB_ITEM_TEMPLATE_TITLE,
            Upper_Spec: jobItemTemplate.UPPER_SPEC,
            Lower_Spec: jobItemTemplate.LOWER_SPEC,
            Test_Method: jobItemTemplate.TEST_METHOD,
            "Create At": jobItemTemplate.createdAt,
            Action: (
                <div className="flex items-center justify-center gap-2">
                    <Link
                        className="text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center
                    bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        href={{
                            pathname: "/pages/edit-job-item-template",
                            query: {
                                jobItemTemplate_id: jobItemTemplate._id,
                                jobTemplate_id: jobTemplate_id,
                            },
                        }}
                    >
                        Edit
                    </Link>
                    <button
                        className={`text-white font-bold rounded-lg text-sm px-2 py-2.5 text-center 
                            ${user && user.actions && !user.actions.some(action => action._id === enabledFunction["remove-job-item-template"]) ?
                                'bg-red-500 cursor-not-allowed' :
                                'bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800'}`}
                        onClick={() => handleRemove(jobItemTemplate._id)}
                        disabled={!user || !user.actions || !user.actions.some(action => action._id === enabledFunction["remove-job-item-template"])}
                    >
                        Remove
                    </button>

                </div>
            ),
        };
    });


    const HandleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const data = {
            AUTHOR_ID: user._id,
            JOB_ITEM_TEMPLATE_TITLE: form.get("job_item_template_title"),
            JOB_ITEM_TEMPLATE_NAME: form.get("job_item_template_name"),
            UPPER_SPEC: form.get("upper_spec"),
            LOWER_SPEC: form.get("lower_spec"),
            TEST_METHOD: form.get("test_method"),
            JOB_TEMPLATE_ID: jobTemplate_id,
            JobTemplateCreateID: jobTemplate.JobTemplateCreateID,
            TEST_LOCATION_ID: form.get("test_location")
        };

        const formData = new FormData();
        formData.append('AUTHOR_ID', data.AUTHOR_ID);
        formData.append('JOB_ITEM_TEMPLATE_TITLE', data.JOB_ITEM_TEMPLATE_TITLE);
        formData.append('JOB_ITEM_TEMPLATE_NAME', data.JOB_ITEM_TEMPLATE_NAME);
        formData.append('UPPER_SPEC', data.UPPER_SPEC);
        formData.append('LOWER_SPEC', data.LOWER_SPEC);
        formData.append('TEST_METHOD', data.TEST_METHOD);
        formData.append('JOB_TEMPLATE_ID', data.JOB_TEMPLATE_ID);
        formData.append('JobTemplateCreateID', data.JobTemplateCreateID);
        formData.append('TEST_LOCATION_ID', data.TEST_LOCATION_ID);
        if (selectedFile) {
            formData.append('FILE', selectedFile);
        }

        try {
            const response = await fetch(`/api/job-item-template/create-job-item-template`, {
                method: "POST",
                body: formData,
                next: { revalidate: 10 },
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire("Success", "Product added successfully", "success");
                setRefresh((prev) => !prev);
            } else {
                Swal.fire("Error", result.message || "Failed to add product", "error");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to add product", "error");
        }
    };



    const handleRemove = async (jobItemTemplate_id) => {

        try {
            const response = await fetch(`/api/job-item-template/remove-job-item-template`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ jobItemTemplate_id }),
                next: { revalidate: 10 },
            });
            const data = await response.json();

            setRefresh((prev) => !prev);

        } catch (err) {
            console.log(err);
        }
    }

    const handleClearImage = () => {
        setSelectedFile(null);
    }

    return (
        <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 gap-7">
            <div className="flex flex-col gap-3">
                <h1 className="text-2xl font-bold text-primary flex items-center">{">"} {jobTemplate.JOB_TEMPLATE_NAME} </h1>
                <h1 className="text-1xl font-semibold">Add Checklist Item to Checklist Template</h1>
            </div>
            <form onSubmit={HandleSubmit} className="flex flex-col justify-center gap-8">
                <div className="grid gap-6 mb-6 md:grid-cols-3 row-span-4">
                    <div className=" flex flex-col gap-4 justify-center items-center w-full row-span-4">
                        <div
                            {...getRootProps()}
                            id="fileInputDropzone"
                            className="px-5 w-full bg-white rounded-2xl h-full border-2 border-[#4398E7] flex justify-center items-center"
                        >
                            <input
                                {...getInputProps()}
                                id="fileInput"

                            />

                            <div className="flex flex-col justify-center items-center">
                                {selectedFile ? (
                                    <Image
                                        src={URL.createObjectURL(selectedFile)}
                                        alt="selected"
                                        width={100}
                                        height={100}
                                    />
                                ) : (
                                    <>
                                        <Image
                                            src="/assets/images/image.png"
                                            alt="plus"
                                            width={50}
                                            height={50}
                                        />
                                        <h1 className="text-secondary">
                                            Drop your image here, or click to select one
                                        </h1>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                className="bg-[#347EC2] text-white text-sm px-4 py-2 rounded-lg drop-shadow-lg hover:bg-[#4398E7] hover:text-white"
                                type="button"
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                <div className="flex justify-center items-center gap-2 font-bold">

                                    <p> Add the image</p>
                                </div>
                            </button>
                            <button
                                className="bg-red-500 text-sm font-bold text-white px-4 py-2 rounded-lg drop-shadow-lg hover:bg-red-700 hover:text-white" type="button" onClick={handleClearImage}>
                                <div className="flex justify-center items-center gap-2">
                                    <p>Clear the image</p>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="author"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Author
                        </label>
                        <input
                            type="text"
                            id="author"
                            className="bg-gray-200 border cursor-not-allowed border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 opacity-50"
                            value={user?.name || ""}
                            disabled
                            name="author"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="job_item_template_title"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Checklist Item Template Title
                        </label>
                        <input
                            type="text"
                            id="job_item_template_title"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Item Title"
                            name="job_item_template_title"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="job_item_template_name"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Checklist Item Template Name
                        </label>
                        <input
                            type="text"
                            id="job_item_template_name"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Item Name"
                            name="job_item_template_name"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="upper_spec"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Upper Spec
                        </label>
                        <input
                            type="text"
                            id="upper_spec"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Upper Spec"
                            name="upper_spec"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="lower_spec"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Lower Spec
                        </label>
                        <input
                            type="text"
                            id="lower_spec"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Lower Spec"
                            name="lower_spec"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="test_method"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Test Method
                        </label>
                        <input
                            type="text"
                            id="test_method"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="test method"
                            name="test_method"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="test_location"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Test Location
                        </label>
                        <Select name="test_location" id="test_location" className="text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
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
                    className={`text-white font-bold rounded-lg text-sm px-5 py-2.5 text-center w-1/3 hover:bg-blue-800 focus:ring-4 focus:outline-none
                    ${user && user.actions && !user.actions.some(action => action._id === enabledFunction["add-job-item-template"]) ?
                            'bg-blue-500 cursor-not-allowed' :
                            'bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'}`}
                    disabled={!user || !user.actions || !user.actions.some(action => action._id === enabledFunction["add-job-item-template"])}
                >
                    Add Checklist Item Template
                </button>
            </form>

            <TableComponent
                headers={jobItemTemplateHeader}
                datas={jobItemTemplateBody}
                TableName={"Checklist Item Templates"}
                searchColumn={"Title"}
            />

        </Layout>
    );
};

export default Page;
