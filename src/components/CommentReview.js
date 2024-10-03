

const CommentReview = ({
    toggleAddComment,
    handleReject,
    commentDetail
 }) => {
    return (
        <div className="fixed  inset-0 overflow-y-auto z-[200]">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <form className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex flex-col gap-3 justify-start items-center  w-full"
                           onSubmit={handleReject}
                        >
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                Add Comment to {commentDetail.Name}
                            </h3>
                            <textarea className="w-full h-96 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Add Comment"
                                name="comment" id="comment"
                            />

                            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Submit
                            </button>


                        </form>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={toggleAddComment}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
    )
}

export default CommentReview;