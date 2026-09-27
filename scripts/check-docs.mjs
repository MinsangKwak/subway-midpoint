// 저장소 Markdown의 상대 파일 링크와 코드 펜스를 검사한다.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const skipped = new Set(['.git', 'node_modules', 'dist', '.cache']);
const markdownFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return skipped.has(entry.name) ? [] : markdownFiles(target);
    return entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
  }));
  return files.flat();
};

const errors = [];
const files = await markdownFiles(root);
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const label = path.relative(root, file);
  let fence = null;
  const prose = [];
  for (const line of source.split('\n')) {
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (match) {
      if (!fence) fence = match[1];
      else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
      continue;
    }
    if (!fence) prose.push(line);
  }
  if (fence) errors.push(`${label}: 닫히지 않은 코드 블록`);
  for (const match of prose.join('\n').matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(href)) continue;
    const target = decodeURIComponent(href.split('#')[0]);
    if (!target) continue;
    try {
      await stat(path.resolve(path.dirname(file), target));
    } catch {
      errors.push(`${label}: 파일을 찾을 수 없음: ${href}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Markdown ${files.length}개: 상대 파일 링크·코드 블록 검사 통과 (외부 URL·앵커 제외)`);
}
