import React, { useEffect, useState } from "react";
import Chat from "./Chat";
import { fetchOpenAIResponse } from "../utils/fetchOpenAIResponse";
import RequestForm from "./RequestForm";

const ResumeUploader = () => {
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialText, setInitialText] = useState<string>();
  const [interviewData, setInterviewData] = useState({
    jobDescriptionText: "",
    interviewType: "",
    resumeText: "",
  });

  useEffect(() => {
    const startInterview = async (text: string) => {
      const messageToSend = `INTERVIEW TYPE: ${interviewData.interviewType}
      ------------
      RESUME: ${text}
      ------------
      JOB DESCRIPTION: ${interviewData.jobDescriptionText}
      ------------`;
      await fetchOpenAIResponse(
        [{ role: "user", content: messageToSend }],
        (msg) => setInitialText(msg)
      );
    };

    if (
      isLoading &&
      interviewData.resumeText &&
      interviewData.jobDescriptionText
    ) {
      startInterview(interviewData.resumeText).then(() => {
        setIsLoading(false);
        setShowChat(true);
      });
    }
  }, [interviewData.resumeText, interviewData.jobDescriptionText, isLoading]);

  return (
    <div className="form-wrapper">
      {!showChat ? (
        <div className="request-form-wrapper">
          {!isLoading ? (
            <RequestForm
              interviewData={interviewData}
              setIsLoading={setIsLoading}
              setInterviewData={setInterviewData}
            />
          ) : (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading your interview...</p>
            </div>
          )}
        </div>
      ) : (
        <Chat initialText={initialText} interviewData={interviewData} />
      )}
    </div>
  );
};

export default ResumeUploader;
