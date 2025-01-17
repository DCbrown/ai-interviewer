import React from "react";

type ChatInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  input: string;
  setInput: (value: string) => void;
};

const ChatInputModal: React.FC<ChatInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  input,
  setInput,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
        <form onSubmit={onSubmit}>
          <input
            name="input-field"
            type="text"
            placeholder="Say anything"
            onChange={(e) => setInput(e.target.value)}
            value={input}
            className="w-full mb-4 p-2 border rounded"
            style={{ position: "absolute", left: "-9999px" }}
            disabled={true}
          />
          <div className="mb-4 text-center text-black">
            {" "}
            {input ? <strong>You Said: </strong> : ""} {input}
          </div>
          <div className="flex gap-2 justify-center">
            {" "}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit Response
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel Response
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInputModal;
