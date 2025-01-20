import React, { useState } from "react";
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";

interface InterviewData {
  jobDescriptionText: string;
  interviewType: string;
  resumeText: string;
}

type Props = {
  interviewData: InterviewData;
  setInterviewData: React.Dispatch<React.SetStateAction<InterviewData>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequestForm: React.FC<Props> = ({
  interviewData,
  setInterviewData,
  setIsLoading,
}) => {
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [errors, setErrors] = useState({
    jobUrl: "",
    interviewType: "",
    resume: "",
  });

  const mergeTextContent = (textContent: TextContent) => {
    return textContent.items
      .map((item) => {
        const { str, hasEOL } = item as TextItem;
        return str + (hasEOL ? "\n" : "");
      })
      .join("");
  };

  const readResume = async (pdfFile: File | undefined) => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    if (!pdfFile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (arrayBuffer && arrayBuffer instanceof ArrayBuffer) {
        const loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer));
        loadingTask.promise.then(
          (pdfDoc) => {
            pdfDoc.getPage(1).then((page) => {
              page.getTextContent().then((textContent) => {
                const extractedText = mergeTextContent(textContent);
                setInterviewData((data: InterviewData) => ({
                  ...data,
                  resumeText: extractedText,
                }));
              });
            });
          },
          (reason) => {
            console.error(`Error during PDF loading: ${reason}`);
          }
        );
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  };

  const scrapeJobDescription = async (url: string) => {
    const response = await fetch(`/api/scrapper`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    const responseData = await response.json();
    setInterviewData((data) => ({
      ...data,
      jobDescriptionText: responseData.textContent,
    }));
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      try {
        await readResume(file);
        setErrors((prev) => ({ ...prev, resume: "" }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          resume: "Error processing resume. Please try again.",
        }));
        setFileName("");
      }
    }
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newErrors = {
      jobUrl: "",
      interviewType: "",
      resume: "",
    };
    let isValid = true;

    if (!jobDescriptionUrl) {
      newErrors.jobUrl = "Please enter a job description URL";
      isValid = false;
    }

    if (!interviewData.interviewType) {
      newErrors.interviewType = "Please select an interview type";
      isValid = false;
    }

    if (!interviewData.resumeText) {
      newErrors.resume = "Please upload your resume";
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      try {
        setIsLoading(true);
        await scrapeJobDescription(jobDescriptionUrl);
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          jobUrl:
            "Error fetching job description. Please check the URL and try again.",
        }));
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Start Your Interview Journey</h1>
      <p className="form-subtitle">
        Complete the form below to begin the interview process
      </p>

      <div className="input-group">
        <label className="input-label">Job Description URL</label>
        <input
          type="url"
          className={`input-field ${errors.jobUrl ? "error" : ""}`}
          placeholder="Paste the job URL here"
          value={jobDescriptionUrl}
          onChange={(e) => {
            setJobDescriptionUrl(e.target.value);
            if (e.target.value) {
              setErrors((prev) => ({ ...prev, jobUrl: "" }));
            }
          }}
        />
        {errors.jobUrl && <p className="error-message">{errors.jobUrl}</p>}
      </div>

      <div className="input-group">
        <label className="input-label">Interview Type</label>
        <select
          className={`select-field ${errors.interviewType ? "error" : ""}`}
          value={interviewData.interviewType}
          onChange={(e) => {
            setInterviewData((prev) => ({
              ...prev,
              interviewType: e.target.value,
            }));
            if (e.target.value) {
              setErrors((prev) => ({ ...prev, interviewType: "" }));
            }
          }}
        >
          <option value="">Select Interview Type</option>
          <option value="behavioral">Behavioral</option>
          <option value="project">Project</option>
        </select>
        {errors.interviewType && (
          <p className="error-message">{errors.interviewType}</p>
        )}
      </div>

      <div className="input-group">
        <input
          type="file"
          id="file-upload"
          onChange={handleResumeUpload}
          accept="application/pdf"
          hidden
        />
        <label htmlFor="file-upload" className="upload-button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName ? fileName : "Upload Resume"}
        </label>
        {errors.resume && <p className="error-message">{errors.resume}</p>}
      </div>

      <button onClick={handleSubmit} className="submit-button">
        Start Interview
      </button>
    </div>
  );
};

export default RequestForm;
