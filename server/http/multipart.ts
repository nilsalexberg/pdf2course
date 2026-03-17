import { readMultipartFormData } from 'h3'

export interface MultipartFile {
  data: Buffer
  filename: string
  type: string
}

export interface MultipartResult {
  fields: Record<string, string>
  files: Record<string, MultipartFile>
}

type MultipartPart = { data: Buffer; name?: string; filename?: string; type?: string }

export async function readMultipart(event: any): Promise<MultipartPart[] | undefined> {
  return await readMultipartFormData(event)
}

export function parseMultipart(parts: MultipartPart[] | undefined): MultipartResult {
  const fields: Record<string, string> = {}
  const files: Record<string, MultipartFile> = {}

  if (!parts) return { fields, files }

  for (const part of parts) {
    const name = part.name?.toLowerCase()
    if (!name || !part.data) continue

    if (part.filename) {
      files[name] = {
        data: part.data,
        filename: part.filename,
        type: part.type ?? '',
      }
      continue
    }

    fields[name] = part.data.toString('utf-8')
  }

  return { fields, files }
}

export async function readCourseCreateMultipart(event: any) {
  const parts = await readMultipart(event)
  const { fields, files } = parseMultipart(parts)
  return {
    fields,
    cover: files.cover ?? null,
  }
}

