import type { Course } from '../../../types/course';
import type { MultipartFile } from '../../http/multipart';
import type { CourseCreateInput } from '../../validators/courseSchemas';
import { CourseCreateLimits } from '../../validators/courseSchemas';
import { insertCourse, updateCourseCoverUrl, insertCoursePdf } from '../../repositories/courseRepo';
import { buildCoverPath, uploadCourseCover, validateCoverFile } from '../../storage/courseCovers';
import { buildPdfPath, uploadCoursePdf, validatePdfFile } from '../../storage/coursePdfs';

export async function createCourse(
  userId: string,
  input: CourseCreateInput,
  coverFile: MultipartFile | null,
  pdfs: MultipartFile[]
): Promise<Course> {
  if (pdfs.length > CourseCreateLimits.pdfs.maxFiles) {
    throw createError({
      statusCode: 400,
      statusMessage: `Maximum ${CourseCreateLimits.pdfs.maxFiles} PDFs allowed`
    });
  }

  const config = {
    numModules: input.numModules,
    lessonsPerModule: input.lessonsPerModule,
    languageLevel: input.languageLevel,
    focus: input.focus,
    language: input.language,
    tone: input.tone
  };

  const course = await insertCourse({
    producerId: userId,
    title: input.title,
    description: input.description,
    coverUrl: null,
    config
  });

  if (!course) throw createError({ statusCode: 500, statusMessage: 'Course creation failed' });

  if (coverFile) {
    validateCoverFile(coverFile);
    const path = buildCoverPath(userId, course.id, coverFile.filename);
    await uploadCourseCover(path, coverFile);
    await updateCourseCoverUrl(course.id, path);
  }

  for (const pdf of pdfs) {
    validatePdfFile(pdf);
    const path = buildPdfPath(userId, course.id, pdf.filename);
    await uploadCoursePdf(path, pdf);
    await insertCoursePdf({
      courseId: course.id,
      filePath: path,
      filename: pdf.filename,
      sizeBytes: pdf.data.length
    });
  }

  return {
    ...course,
    coverUrl: coverFile ? buildCoverPath(userId, course.id, coverFile.filename) : null
  };
}
