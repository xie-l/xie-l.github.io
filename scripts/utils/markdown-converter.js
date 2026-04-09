// scripts/utils/markdown-converter.js
const { marked } = require('marked');
const hljs = require('highlight.js');

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.warn(`代码高亮失败: ${lang}`, err);
      }
    }
    return code;
  },
  breaks: true,
  gfm: true
});

function processInternalLinks(content) {
  return content.replace(/\[\[([^\]|]+)\]\]/g, (match, link) => {
    return link;
  }).replace(/\[\[([^#]+)#([^\]]+)\]\]/g, (match, file, heading) => {
    return `${file}#${heading}`;
  });
}

function processEmbeds(content, articlePath) {
  return content.replace(/!\[\[([^\]|]+\.\w+)\]\]/g, (match, filename) => {
    return `![${filename}](./attachments/${filename})`;
  }).replace(/!\[\[([^\]|]+)\|(\d+)\]\]/g, (match, filename, width) => {
    return `![${filename}](./attachments/${filename}){width=${width}}`;
  });
}

function processTasks(content) {
  return content
    .replace(/^- \[ \] /gm, '- <input type="checkbox" disabled> ')
    .replace(/^- \[x\] /gm, '- <input type="checkbox" checked disabled> ');
}

function removeComments(content) {
  return content.replace(/%%[^%]+%%/g, '');
}

function convertMarkdownToHtml(markdown, options = {}) {
  try {
    let processedContent = markdown;
    
    if (options.processInternalLinks !== false) {
      processedContent = processInternalLinks(processedContent);
    }
    
    if (options.processEmbeds !== false) {
      processedContent = processEmbeds(processedContent, options.articlePath);
    }
    
    if (options.processTasks !== false) {
      processedContent = processTasks(processedContent);
    }
    
    if (options.removeComments !== false) {
      processedContent = removeComments(processedContent);
    }
    
    const html = marked.parse(processedContent);
    
    return html;
  } catch (error) {
    throw new Error(`Markdown 转换失败: ${error.message}`);
  }
}

module.exports = {
  convertMarkdownToHtml,
  processInternalLinks,
  processEmbeds,
  processTasks,
  removeComments
};
