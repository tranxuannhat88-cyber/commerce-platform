const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.gemini') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full);
    } else if (/\.(tsx|ts)$/.test(file)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/placeholder=[\"'][^\"']*(VD:|vd:|Ví dụ|ví dụ|Gợi ý|Mô tả tóm tắt|Khám phá|Chuyên cung cấp|INVAMAX|2K Tower|Bàn thao tác|Hải Phòng)[^\"']*[\"']/i.test(line)) {
          console.log(`${full}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

searchDir('.');
