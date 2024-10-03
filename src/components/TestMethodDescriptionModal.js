import Image from 'next/image';

const TestMethodDescriptionModal = ({ setTestMethodDescription, showDetail = {} }) => {
    const { File, TestMethod } = showDetail;

    // Replace backslashes with forward slashes in the File path
    console.log(File);
    const imagePath = File ? File.replace(/\\/g, '/') : null;

    return (
        <div className="fixed inset-0 overflow-y-auto mt-5 z-[200]">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex flex-col gap-3 justify-between">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                    Test Method Description
                                </h3>

                                {imagePath && (
                                    <Image src={imagePath} alt="overlay" width={300} height={300} className="rounded-lg" />
                                )}

                                <p className="text-sm text-gray-500">
                                    {TestMethod || 'No test method description available.'}
                                </p>
                               
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setTestMethodDescription((prev) => (!prev))}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TestMethodDescriptionModal;
