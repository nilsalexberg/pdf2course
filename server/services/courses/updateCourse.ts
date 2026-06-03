import { createError } from 'h3';
import type { Course } from '../../../types/course';
import type { MultipartFile } from '../../http/multipart';
import type { CourseCreateInput } from '../../validators/courseSchemas';
import {
  getCourseById,
  updateCourse as updateRepoCourse,
  updateCourseCoverUrl,
  insertCoursePdf
} from '../../repositories/courseRepo';
import {
  buildCoverPath,
  uploadCourseCover,
  validateCoverFile,
  deleteCourseCover
} from '../../storage/courseCovers';
import { buildPdfPath, uploadCoursePdf, validatePdfFile } from '../../storage/coursePdfs';

export async function updateCourse(
  userId: string,
  courseId: string,
  input: CourseCreateInput,
  coverFile: MultipartFile | null,
  pdfs: MultipartFile[] = []
): Promise<Course | null> {
  const course = await getCourseById(courseId);

  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  }

  // Security check: ensure the user owns the course
  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const config = {
    num_modules: input.num_modules,
    lessons_per_module: input.lessons_per_module,
    language_level: input.language_level,
    focus: input.focus,
    language: input.language,
    tone: input.tone
  };

  const updatedCourse = await updateRepoCourse(courseId, {
    title: input.title,
    description: input.description,
    config
  });

  if (coverFile) {
    validateCoverFile(coverFile);

    // If there's an old cover, delete it
    if (course.cover_url) {
      try {
        await deleteCourseCover(course.cover_url);
      } catch (err) {
        // Ignore if old cover is missing
      }
    }

    const coverPath = buildCoverPath(userId, courseId, coverFile.filename);
    await uploadCourseCover(coverPath, coverFile);
    await updateCourseCoverUrl(courseId, coverPath);

    // Update the return object path
    if (updatedCourse) {
      updatedCourse.cover_url = coverPath;
    }
  }

  for (const pdf of pdfs) {
    validatePdfFile(pdf);
    const pdfPath = buildPdfPath(userId, courseId, pdf.filename);
    await uploadCoursePdf(pdfPath, pdf);
    await insertCoursePdf({
      course_id: courseId,
      file_path: pdfPath,
      filename: pdf.filename,
      size_bytes: pdf.data.length
    });
  }

  return updatedCourse;
}
