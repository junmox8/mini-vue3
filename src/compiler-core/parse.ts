import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}
export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any = [];
  //循环进行parse
  while (!isEnd(context, ancestors)) {
    const str = context.source;
    let node;
    if (str.startsWith("{{")) {
      //{{message}}
      node = parseInterpolation(context);
    } else if (str.startsWith("<")) {
      //<div></div>
      const regExp = new RegExp(/[a-z]/i);
      if (regExp.test(str[1])) {
        node = parseElement(context, ancestors);
      }
    } else {
      //some text
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context, ancestors) {
  //source无值|遇到结束标签
  const str = context.source;
  if (str.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(context, tag)) {
        return true;
      }
    }
  }
  return !str;
}

function parseText(context) {
  const str = context.source;
  let endIndex = str.length;
  const endTokens = ["{{", "<"];

  endTokens.forEach((item, ind) => {
    const index = str.indexOf(endTokens[ind]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  });
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.Start);
  //收集ancestor 如<div><span></span></div> div span分别入栈
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  //处理</div>部分
  //消除结束标签之前 先鉴定开始，结束标签的tag是否相同
  if (startsWithEndTagOpen(context, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }
  return element;
}

function startsWithEndTagOpen(context, tag) {
  return (
    context.source.startsWith("</") &&
    context.source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context, tagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length + 1);
  //若匹配结束标签 直接return
  if (tagType === TagType.End) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  //将{{message}}中的值拿到
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
  advanceBy(context, openDelimiter.length);
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim(); //{{ message }}情况
  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context, length) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}

function createParserContext(content) {
  return {
    source: content,
  };
}
