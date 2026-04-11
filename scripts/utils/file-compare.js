const fs = require('fs-extra');
const path = require('path');

/**
 * 比较两个文件的时间戳，判断源文件是否比目标文件新
 * @param {string} sourcePath - 源文件路径
 * @param {string} targetPath - 目标文件路径
 * @returns {Promise<object>} - 返回比较结果 { isNewer: boolean, sourceTime: Date, targetTime: Date }
 */
async function isSourceNewer(sourcePath, targetPath) {
  try {
    // 如果目标文件不存在，认为源文件更新
    if (!await fs.pathExists(targetPath)) {
      const sourceStats = await fs.stat(sourcePath);
      return {
        isNewer: true,
        reason: 'target_not_exists',
        sourceTime: sourceStats.mtime,
        targetTime: null
      };
    }
    
    // 获取两个文件的时间戳
    const [sourceStats, targetStats] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(targetPath)
    ]);
    
    // 比较修改时间
    const isNewer = sourceStats.mtime.getTime() > targetStats.mtime.getTime();
    
    return {
      isNewer: isNewer,
      reason: isNewer ? 'source_newer' : 'target_newer_or_same',
      sourceTime: sourceStats.mtime,
      targetTime: targetStats.mtime
    };
  } catch (error) {
    throw new Error(`文件比较失败: ${error.message}`);
  }
}

/**
 * 格式化时间戳为可读字符串
 * @param {Date} date - 时间戳
 * @returns {string} - 格式化的时间字符串
 */
function formatTime(date) {
  if (!date) return 'N/A';
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = { isSourceNewer, formatTime };
