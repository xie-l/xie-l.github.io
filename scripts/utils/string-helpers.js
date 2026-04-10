/**
 * 字符串辅助函数
 */
const path = require('path');

/**
 * 将数字补零到指定长度
 * @param {number} n - 数字
 * @param {number} length - 目标长度（默认2）
 * @returns {string} 补零后的字符串
 */
function pad(n, length = 2) {
  return String(n).padStart(length, '0');
}

/**
 * HTML转义，防止XSS攻击
 * @param {string} str - 输入字符串
 * @returns {string} 转义后的字符串
 */
function safeHtml(str) {
  return String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 清理文件名中的非法字符
 * @param {string} filename - 文件名
 * @param {number} maxLength - 最大长度（默认50）
 * @returns {string} 清理后的文件名
 */
function sanitizeFilename(filename, maxLength = 50) {
  return filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, maxLength);
}

/**
 * 验证文件路径是否安全（防止路径遍历攻击）
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否安全
 */
function isValidPath(filePath) {
  // 检查是否包含路径遍历字符
  if (filePath.includes('..') || path.isAbsolute(filePath)) {
    return false;
  }
  
  // 检查是否包含非法字符
  const invalidChars = /[<>:"|?*\u0000-\u001f]/;
  if (invalidChars.test(filePath)) {
    return false;
  }
  
  return true;
}

/**
 * 生成文件键名（用于文件匹配）
 * @param {string} filename - 文件名
 * @returns {string} 文件键名
 */
function getFileKey(filename) {
  // 移除扩展名和时间戳，只保留标题部分
  return filename
    .replace(/\.(md|html)$/, '')
    .replace(/\（\d{6}\）$/, '') // 移除时间戳如（202604）
    .replace(/\(\d{6}\)$/, '')  // 移除时间戳如(202604)
    .trim();
}

module.exports = {
  pad,
  safeHtml,
  sanitizeFilename,
  isValidPath,
  getFileKey
};
