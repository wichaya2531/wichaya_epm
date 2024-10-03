const MessageBox = ({ message, buttons=[] }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-slate-500 bg-opacity-50 w-auto px-20 h-auto py-5 flex flex-col justify-center items-center gap-4 text-lg">
          <p className="text-white">{message}</p>
          <div className="flex gap-4">
          {buttons.map((button, index) => (
            <span key={index}>{button}</span>
          ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default MessageBox;
  