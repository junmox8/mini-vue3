import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}
export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];
  const str = context.source;
  let node;
  if (str.startsWith("{{")) {
    //{{message}}
    node = parseInterpolation(context);
  } else if (str.startsWith("<")) {
    //<div></div>
    const regExp = new RegExp(/[a-z]/i);
    if (regExp.test(str[1])) {
      node = parseElement(context);
    }
  }
  nodes.push(node);

  return nodes;
}

function parseElement(context) {
  const element = parseTag(context, TagType.Start);
  //处理</div>部分
  parseTag(context, TagType.End);
  return element;
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
  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim(); //{{ message }}情况
  advanceBy(context, rawContentLength + closeDelimiter.length);

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
  };
}

function createParserContext(content) {
  return {
    source: content,
  };
}
