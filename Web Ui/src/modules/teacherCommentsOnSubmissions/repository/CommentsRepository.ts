import axios from "axios";
import TeacherCommentsRepositoryInterface from "../domain/CommentsRepositoryInterface";
import { CommentDataObject,CommentsCreationObject } from "../domain/CommentsInterface";
import { VITE_API } from "../../../../config";

const API_BASE = (VITE_API as any) || "/api";
const API_URL = API_BASE.replace(/\/$/, "") + "/commentsSubmission";


class TeacherCommentsRepository implements TeacherCommentsRepositoryInterface {
  
  async getCommentsBySubmissionId(submissionId: number): Promise<CommentDataObject[]> {
    try {
      const response = await axios.get<CommentDataObject[]>(`${API_URL}/${submissionId}`);
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error("Failed to get comments by submission ID");
      }
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 404) {
        // No comments endpoint or none for this submission -> treat as empty
        console.warn(`Comments not found for submission ${submissionId}`);
        return [];
      }
      console.error("Error getting comments by submission ID:", error);
      throw error;
    }
  }
  async createComment(commentData: CommentsCreationObject): Promise<CommentDataObject> { 
    try {
      console.log("TRATANDO: ",`${API_URL}`)
      const response = await axios.post<CommentDataObject>(API_URL, commentData);
      if (response.status === 201) { 
        return response.data; 
      } else {
        throw new Error("Failed to create comment");
      }
    } catch (error) {
      console.error("Error al crear el comentario:", error);
      throw error;
    }
}


}


export default TeacherCommentsRepository;