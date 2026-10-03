const uploadChatToPdf = async (pdfBuffer, userId, fileName) => {
    console.log("upload service",pdfBuffer, userId, fileName);
  try {
    const formData = new FormData();

    formData.append(
      "file",
      new Blob([pdfBuffer], { type: "application/pdf" }),
      fileName,
    );


    console.log("Uploading PDF to RAG service for user:", userId, "File name:", fileName);
    console.log("FormData keys:", Array.from(formData.keys()));

    const response = await fetch(
      process.env.CHAT_PDF_ENDPOINT + "/document/upload",
      {
        method: "POST",

        headers: {
          "X-Internal-Key": process.env.INTERNAL_SERVICE_KEY,
          "X-User-Id": userId,
        },

        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "RAG document upload failed");
    }

    return data;
  } catch (error) {
    console.error("Error in uploadChatToPdf:", error);
    throw new Error("Failed to upload PDF");
  }

};

const chatWithPdf = async (query, documentId, userId) => {

    console.log("chat service", query, documentId, userId)
  try {
    const response = await fetch(
      process.env.CHAT_PDF_ENDPOINT + "/document/chat",
      {
        method: "POST",

        headers: {
         "Content-Type": "application/json",
          "X-Internal-Key": process.env.INTERNAL_SERVICE_KEY,
          "X-User-Id": userId,
          
        },

        body: JSON.stringify({
          query,
          documentId,
        }),
      },
    );

    const data = await response.json();

    console.log("chat res", data)

    if (!response.ok) {
      throw new Error(data.message || "RAG document chat failed");
    }

    return data;
  } catch (error) {
    console.error("Error in chatWithPdf:", error);
    throw new Error("Failed to chat with PDF");
  }
};

module.exports = {
  uploadChatToPdf,
  chatWithPdf,
};
