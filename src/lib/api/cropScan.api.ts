import type { CropScan, UploadResult } from "@/lib/types/api";
import { api } from "./farmnomad";

/**
 * Crop scanner (spec §7.14), all through the Spring Boot API:
 *   1. POST /uploads          multipart `file`  → { url }   (Cloudinary; the prerequisite)
 *   2. POST /crop-scans/diagnose { imageUrl }   → CropScan  (backend calls farmnomad-ai and saves it)
 *   3. GET  /crop-scans/my                      → CropScan[]
 *   4. DELETE /crop-scans/{id}
 * CONFIRM WITH BACKEND: the diagnose path and response fields.
 */
const cropScanApi = api.enhanceEndpoints({ addTagTypes: ["CropScan"] }).injectEndpoints({
  endpoints: (b) => ({
    uploadImage: b.mutation<UploadResult, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "/uploads", method: "POST", body };
      },
    }),
    diagnose: b.mutation<CropScan, { imageUrl: string }>({
      query: (body) => ({ url: "/crop-scans/diagnose", method: "POST", body }),
      invalidatesTags: ["CropScan"],
    }),
    myCropScans: b.query<CropScan[], void>({ query: () => "/crop-scans/my", providesTags: ["CropScan"] }),
    deleteCropScan: b.mutation<void, number>({ query: (id) => ({ url: `/crop-scans/${id}`, method: "DELETE" }), invalidatesTags: ["CropScan"] }),
  }),
});

export const { useUploadImageMutation, useDiagnoseMutation, useMyCropScansQuery, useDeleteCropScanMutation } = cropScanApi;

/** Confidence as 0–100, whichever scale the backend sends (spec §10 Q6). */
export const confidencePct = (c: number) => Math.round(c <= 1 ? c * 100 : c);
