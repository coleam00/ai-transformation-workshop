const DEFAULT_FILENAME = "poll-results";
const MAX_BASENAME_LENGTH = 100;
const MAX_CONTROL_CHAR_CODE = 0x1f;
const DEL_CHAR_CODE = 0x7f;
const MAX_ASCII_PRINTABLE_CODE = 0x7e;

function isControlCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code <= MAX_CONTROL_CHAR_CODE || code === DEL_CHAR_CODE;
}

function isNonAsciiCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code < 0x20 || code > MAX_ASCII_PRINTABLE_CODE;
}

/**
 * Strips control characters (including CR/LF, which could otherwise be used
 * for HTTP header injection) from `value`, replacing each with a space.
 */
function stripControlCharacters(value: string): string {
  const chars = [];
  for (const char of value) {
    chars.push(isControlCharacter(char) ? " " : char);
  }
  return chars.join("");
}

/**
 * Derives a filesystem- and HTTP-header-safe base filename from an arbitrary
 * user-supplied string (e.g. a poll title). Strips control characters
 * (including CR/LF, which could otherwise be used for header injection once
 * this value is interpolated into a `Content-Disposition` header), replaces
 * path separators and filename-illegal characters, collapses whitespace, and
 * falls back to a generic name if nothing safe remains.
 */
export function toSafeFilename(title: string, extension: string): string {
  const withoutControlChars = stripControlCharacters(title);
  const withoutIllegalChars = withoutControlChars.replace(/[/\\<>:"|?*]/g, "-");
  const collapsed = withoutIllegalChars.replace(/[\s-]+/g, " ").trim();
  const truncated = collapsed.slice(0, MAX_BASENAME_LENGTH).trim();
  const base = truncated.length > 0 ? truncated : DEFAULT_FILENAME;
  return `${base}.${extension}`;
}

/**
 * Builds a `Content-Disposition` header value for downloading `filename` as
 * an attachment. Includes both an ASCII-only `filename="..."` fallback (for
 * older clients) and an RFC 5987 `filename*=UTF-8''...` parameter (for
 * correct handling of non-ASCII characters).
 */
export function buildContentDispositionHeader(filename: string): string {
  const asciiChars = [];
  for (const char of filename) {
    asciiChars.push(isNonAsciiCharacter(char) ? "_" : char);
  }
  const asciiFilename = asciiChars.join("").replace(/"/g, "'");
  const encodedFilename = encodeURIComponent(filename);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
}
