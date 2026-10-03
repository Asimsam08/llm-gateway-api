const { uploadChatToPdf, chatWithPdf } = require("../services/chatpdf.service");

const uploadChatpdf = async (req,res)=>{
    try{
        if(!req.files || Object.keys(req.files).length === 0){
            return res.status(400).json({message: "No file uploaded"});
        }

        const pdfFile = req.files.pdf;
        console.log("Received file:", pdfFile.name, "Size:", pdfFile.size, "Mimetype:", pdfFile.mimetype);
        if(pdfFile.mimetype !== "application/pdf"){
            return res.status(400).json({message: "Invalid file type. Only PDF files are allowed."});
        }   

        console.log("Uploading PDF for user:", req.user.id, "File name:", pdfFile.name);

//         await prisma.document.create({
//   data: {
//     id: documentId,
//     userId: req.user.id,
//     fileName: pdfFile.name,
//   }
// });
   

      const response = await uploadChatToPdf(pdfFile.data, req.user.id, pdfFile.name);

      console.log("Upload response:", response);



      res.status(200).json({
        message: "PDF uploaded successfully",
        data: response
      });
        

    }catch(error){
        console.error("Error in chatpdfController:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

const chatpdf = async (req, res) =>{
    try{

        if(!req.body.query || !req.body.documentId){
            return res.status(400).json({message: "Query and documentId are required"});
        }

         console.log("chat params", req.body.query, req.body.documentId, req.user.id)
        const response = await chatWithPdf(req.body.query, req.body.documentId, req.user.id);

        res.status(200).json({
             message: "Query processed successfully",
            data: response
        });


    }catch(error){
        console.error("Error in chatpdfController:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

module.exports = {
    uploadChatpdf,
    chatpdf
}