"use client";
import Layout from "@/components/Layout.js";
import useFetchJobValue from "@/lib/hooks/useFetchJobValue";
import React, { useEffect, useState } from "react";
import { config } from "@/config/config.js";
import Swal from 'sweetalert2'
import useFetchStatus from "@/lib/hooks/useFetchStatus";
import useFetchMachines from "@/lib/hooks/useFetchMachines";
import TestMethodDescriptionModal from "@/components/TestMethodDescriptionModal";
import ItemInformationModal from "@/components/ItemInformationModal";
import AddCommentModal from "@/components/AddCommentModal";
import JobRetakeForm from "./JobRetakeForm.js";
import { useRouter } from 'next/navigation'
import mqtt from 'mqtt';
import useFetchUser from "@/lib/hooks/useFetchUser.js";


const connectUrl = process.env.NEXT_PUBLIC_MQT_URL;
const options = {
    username: process.env.NEXT_PUBLIC_MQT_USERNAME,
    password: process.env.NEXT_PUBLIC_MQT_PASSWORD
};


const Page = ({ searchParams }) => {
    const job_id = searchParams.job_id
    const [view, setView] = useState(true);
    const router = useRouter();
    const [refresh, setRefresh] = useState(false);
    const { jobData, jobItems, isLoading } = useFetchJobValue(job_id, refresh);
    const { user } = useFetchUser(refresh);
    const [isShowJobInfo, setIsShowJobInfo] = useState(true);
    const [isShowJobItem, setIsShowJobItem] = useState(true);
    const [jobItemDetail, setJobItemDetail] = useState(null);
    const [testMethodDescription, setTestMethodDescription] = useState(null);
    const [AddCommentForm, setAddCommentForm,] = useState(false);
    const [commentDetail, setCommentDetail] = useState(null);
    const [inputValues, setInputValues] = useState([]);
    const [showDetail, setShowDetail] = useState(null);

    const mqttClient = mqtt.connect(connectUrl, options);

    useEffect(() => {

        if (user && jobData) {

            // Ensure both user.workgroup_id and jobData.WorkGroupID are defined
            if (user.workgroup_id && jobData.WorkGroupID) {
                if (user.workgroup_id.toString() !== jobData.WorkGroupID.toString()) {
                    setView(true);
                } else {
                    setView(false);
                }
            } else {

            }
        }

        mqttClient.on('connect', () => {
           
        });

        mqttClient.on('error', (err) => {
            
            mqttClient.end();
        });

        jobItems.forEach((item) => {
            console.log("item.JobItemID: ", item.JobItemID)
            mqttClient.subscribe(item.JobItemID, (err) => {
                if (!err) {
                    console.log('Subscribed to ' + item.JobItemID);
                } else {
                    console.error('Subscription error: ', err);
                }
            });
        });

        return () => {
            if (mqttClient) {
                mqttClient.end();
            }
        };
    }, [jobItems, user, jobData]);


    mqttClient.on('message', (topic, message) => {
        document.getElementById(topic.toString()).placeholder = message.toString();
    });


    const toggleJobInfo = () => {
        setIsShowJobInfo(!isShowJobInfo);
    }
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const comment = e.target.comment.value;
        setInputValues(prev => {
            const existingIndex = prev.findIndex(entry => entry.jobItemID === commentDetail.JobItemID);
            if (existingIndex !== -1) {
                const updatedValues = [...prev]; // Create a copy of the previous array
                updatedValues[existingIndex] = { // Update the object at existingIndex
                    ...updatedValues[existingIndex], // Preserve other properties
                    Comment: comment // Update the comment property
                };
                return updatedValues; // Return the updated array
            }
            return [...prev, { // If the item doesn't exist, add it with the comment
                ...commentDetail,
                jobItemID: commentDetail.JobItemID,
                Comment: comment
            }];
        });
        setAddCommentForm(false);


    };


    const toggleJobItem = () => {
        setIsShowJobItem(!isShowJobItem);
    }

    const toggleAddComment = (item) => {
        setCommentDetail(() => item);
        setAddCommentForm(prev => !prev);
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        // const { jobID, actualValue, comment } = body;
        const jobID = job_id
        const comments = inputValues.map(item => {
            return {
                jobItemID: item.JobItemID,
                comment: item.Comment
            }
        });

        const actualValues = Object.keys(data).map(key => {
            return {
                jobItemID: key,
                actualValue: data[key]
            }
        });

        try {
            const response = await fetch(`/api/job/job-retake`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobID,
                    submitUser: user._id,
                    actualValue: actualValues,
                    comment: comments
                }),
                next: { revalidate: 10 }
            });
            const data = await response.json();
            if (data.status === 455) {
                Swal.fire({
                    title: "Error!",
                    text: data.message,
                    icon: "error"
                });
            }
            else {
                Swal.fire({
                    title: 'Success',
                    text: data.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Replace the current URL in the browser's history with the dashboard URL
                    window.history.replaceState({}, '', '/pages/dashboard');

                    // Redirect to the dashboard page
                    if (router) {
                        router.push('/pages/dashboard');
                    }
                    // Trigger a refresh
                    setRefresh(!refresh);
                });

            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };




    const handleShowTestMethodDescription = (item) => {
        setShowDetail(item);
        setTestMethodDescription(true);
    }

    const handleShowJobItemDescription = (item) => {
        setJobItemDetail(item);
    }

    return (
        <Layout className="container flex flex-col gap-5 left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
            <div className="bg-yellow-200 border-l-4 border-yellow-500 rounded-md p-4 shadow-md">
                <p className="text-lg font-bold mb-2">Comment Details</p>
                <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-700">Commentator: {jobData.commentator}</p>
                    <p className="text-gray-700">CommentAt: {jobData.commentAt}</p>
                </div>

                <textarea
                    name="comment"
                    id="comment"
                    className="w-full h-24 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 mt-4"
                    defaultValue={jobData.comment}
                    readOnly // Makes the textarea uneditable
                    style={{ backgroundColor: '#f7f7f7', color: '#666', fontStyle: 'italic' }} // Example inline style for decoration
                />
            </div>

            <JobRetakeForm
                jobData={jobData}
                jobItems={jobItems}
                handleSubmit={handleSubmit}
                handleShowJobItemDescription={handleShowJobItemDescription}
                handleShowTestMethodDescription={handleShowTestMethodDescription}
                toggleJobItem={toggleJobItem}
                isShowJobItem={isShowJobItem}
                toggleJobInfo={toggleJobInfo}
                isShowJobInfo={isShowJobInfo}
                toggleAddComment={toggleAddComment}
                view={view}
            />
            {jobItemDetail && <ItemInformationModal
                jobItemDetail={jobItemDetail}
                setJobItemDetail={setJobItemDetail}
            />}
            {testMethodDescription && <TestMethodDescriptionModal
                setTestMethodDescription={setTestMethodDescription}
                showDetail={showDetail}


            />}
            {AddCommentForm && <AddCommentModal
                toggleAddComment={toggleAddComment}
                handleSubmitComment={handleSubmitComment}
                commentDetail={commentDetail}

            />}
        </Layout>
    );
};

export default Page;
