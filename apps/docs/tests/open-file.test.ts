import { describe, expect, it } from 'vitest'
import { findDocxPath } from '../src/shared/open-file'

describe('findDocxPath', () => {
  it('finds Finder and Explorer document arguments case-insensitively', () => {
    expect(findDocxPath(['/Applications/Byeol Docs.app', '/tmp/Quarterly Plan.docx'])).toBe(
      '/tmp/Quarterly Plan.docx',
    )
    expect(findDocxPath(['Byeol Docs.exe', 'C:\\Users\\Me\\REPORT.DOCX'])).toBe(
      'C:\\Users\\Me\\REPORT.DOCX',
    )
  })

  it('ignores Electron switches and unrelated files', () => {
    expect(findDocxPath(['Byeol Docs', '--inspect=document.docx', '/tmp/notes.txt'])).toBeNull()
  })
})
