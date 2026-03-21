import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireHospitalAdmin } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("type") as string) || "image";

    if (!file) return errorResponse("No file provided", 400);

    const maxSize = uploadType === "document" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(`File too large. Max size is ${uploadType === "document" ? "10MB" : "5MB"}`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = uploadType === "document" ? "hms/doctors/documents" : "hms/doctors/images";

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto",
            allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp", "gif"],
          },
          (error, res) => {
            if (error) reject(error);
            else resolve(res);
          }
        )
        .end(buffer);
    });

    return successResponse(
      { url: result.secure_url, publicId: result.public_id, format: result.format },
      "File uploaded successfully"
    );
  } catch (e: any) {
    return errorResponse(e.message || "Upload failed", 500);
  }
}
