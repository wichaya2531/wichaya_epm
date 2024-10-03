'use client'
import { config } from '@/config/config.js';
import React, { useState } from 'react';

const ItemInformationModal = ({ setJobItemDetail, jobItemDetail }) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
        const input = document.getElementById('npm-install');
        input.select();
        document.execCommand('copy');
        setIsCopied(true);

        // Reset the copied state after 3 seconds
        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 overflow-y-auto z-[200]">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                    Title: {jobItemDetail.JobItemTitle}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        CheckList Item ID: {jobItemDetail.JobItemID}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Name: {jobItemDetail.JobItemName}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Upper Spec: {jobItemDetail.UpperSpec}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Lower Spec: {jobItemDetail.LowerSpec}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Test Method: {jobItemDetail.TestMethod}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Test Location: {jobItemDetail.TestLocationName || "N/A"}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Before Value: {jobItemDetail.BeforeValue || "N/A"}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Actual Value: {jobItemDetail.ActualValue || "N/A"}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Comment: {jobItemDetail.Comment || "N/A"}
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[12px] ipadmini:text-sm text-gray-500">
                                        Lastest Update: {jobItemDetail.LastestUpdate || "N/A"}
                                    </p>
                                </div>
                                <hr className="mt-2 mb-2" />
                                <div className="flex flex-col gap-2">
                                    
                                    <h2 className="text-sm text-secondary">
                                    To update the real-time value of this item, connect to the following MQTT topic:
                                    </h2>
                                    <div className="grid grid-cols-8 gap-2 w-full max-w-[23rem]">
                                        <label htmlFor="npm-install" className="sr-only">Label</label>
                                        <input
                                            id="npm-install"
                                            type="text"
                                            className="col-span-6 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            value={jobItemDetail.JobItemID}
                                            readOnly
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="col-span-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 items-center inline-flex justify-center"
                                        >
                                            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>



                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setJobItemDetail(() => (null))}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default ItemInformationModal;