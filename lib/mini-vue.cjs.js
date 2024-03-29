'use strict';

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
function isObject(val) {
    return val && typeof val === "object";
}
function isSame(val, newVal) {
    return val === newVal;
}
function isString(val) {
    return typeof val === "string";
}

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, push);
    push("return");
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(` function ${functionName} (${signature}){`);
    push("return ");
    genNode(ast.codegenNode, context);
    push(`}`);
    return {
        code: context.code,
    };
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */: //插值和text
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i <= children.length - 1; i++) {
        const child = children[i];
        if (isString(child)) {
            //"+"情况
            push(child);
        }
        else {
            //插值和text 正常genNode即可
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { tag, children, props } = node;
    const { push, helper } = context;
    push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}", `);
    genNode(children, context);
    push(`, ${props}`);
    push(")");
}
function genText(node, context) {
    context.push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    context.push(`${context.helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    context.push(`)`);
}
function genExpression(node, context) {
    context.push(`${node.content}`);
}
function createCodegenContext(ast) {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genFunctionPreamble(ast, push) {
    //生成导入逻辑
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length) {
        push(`const { ${ast.helpers.map((str) => aliasHelper(str)).join(", ")} } = ${VueBinging}`);
        push("\n");
    }
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    //循环进行parse
    while (!isEnd(context, ancestors)) {
        const str = context.source;
        let node;
        if (str.startsWith("{{")) {
            //{{message}}
            node = parseInterpolation(context);
        }
        else if (str.startsWith("<")) {
            //<div></div>
            const regExp = new RegExp(/[a-z]/i);
            if (regExp.test(str[1])) {
                node = parseElement(context, ancestors);
            }
        }
        else {
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
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    //收集ancestor 如<div><span></span></div> div span分别入栈
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    //处理</div>部分
    //消除结束标签之前 先鉴定开始，结束标签的tag是否相同
    if (startsWithEndTagOpen(context, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(context, tag) {
    return (context.source.startsWith("</") &&
        context.source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, tagType) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length + 1);
    //若匹配结束标签 直接return
    if (tagType === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
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
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
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
        type: 4 /* NodeTypes.ROOT */,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

function transform(root, options = {}) {
    const context = createTransformsContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    for (let i = 0; i <= nodeTransforms.length - 1; i++) {
        const nodeTransform = nodeTransforms[i];
        nodeTransform(node, context);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            //有children属性再进行递归
            traverseChildren(node, context);
            break;
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i <= children.length - 1; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}
function createTransformsContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper: function (key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode; //{type,props,children,tag}
    }
    else {
        root.codegenNode = child;
    }
}

function createVNodeCall(tag, props, children) {
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        context.helper(CREATE_ELEMENT_VNODE);
        //中间处理
        const vnodeTag = node.tag;
        let vnodeProps = null;
        const children = node.children;
        //compound类型 包含插值和text
        const vnodeChildren = children[0];
        node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren);
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = "_ctx." + node.content;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        const { children } = node;
        let currentContainer;
        for (let i = 0; i <= children.length - 1; i++) {
            const child = children[i];
            if (isText(child)) {
                for (let j = i + 1; j <= children.length - 1; j++) {
                    const next = children[j];
                    if (isText(next)) {
                        if (!currentContainer) {
                            currentContainer = children[i] = {
                                type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                children: [child],
                            };
                        }
                        currentContainer.children.push(" + ");
                        currentContainer.children.push(next);
                        //push后 在children中删掉该元素
                        children.splice(j, 1);
                        //删除后 后面元素会往前移 关注索引
                        j--;
                    }
                    else {
                        currentContainer = undefined;
                        break;
                    }
                }
            }
        }
    }
}

function baseCompiler(str) {
    const ast = baseParse("<div>hi,{{message}}</div>");
    transform(ast, {
        nodeTransforms: [transformExpression, transformText, transformElement],
    });
    return generate(ast);
}

function createVNode(type, children, props) {
    const vnode = {
        type,
        props,
        children,
        el: null, //方便后续$el取值
        shapeFlag: getShapeFlag(type),
        key: props === null || props === void 0 ? void 0 : props.key, //方便后续patch比较
        component: null, //vnode对应的组件实例
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof vnode.children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVnode(text) {
    return createVNode("Text", text, {});
}
function getShapeFlag(type) {
    return typeof type === "string" ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, children, props) {
    return createVNode(type, children, props);
}

function renderSlots(slots, name, props = {}) {
    //这里的slots一定是数组，在initSlot中进行了处理
    if (slots[name]) {
        if (typeof slots[name] === "function") {
            return createVNode("Fragment", slots[name](props), {});
        }
        return createVNode("Fragment", slots[name], {});
    }
}

const publicPropertiesMap = {
    //需要注意 返回的是组件的虚拟节点的el 所以后续在注册完元素后获取el 需要挂载到组件节点上。
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
    $props: (instance) => instance.props,
};
const PublicInstanceProxyHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (key in props) {
            return props[key];
        }
        const PublicGetter = publicPropertiesMap[key];
        if (PublicGetter) {
            return PublicGetter(instance);
        }
    },
};

function initProps(instance, props) {
    instance.props = props || {};
}

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, schedule) {
        this.fn = fn;
        this.schedule = schedule;
        this.deps = new Set([]);
        this.active = true;
    }
    run() {
        if (!this.active) {
            return this.fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this.fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        this.cleanupEffect(this);
    }
    cleanupEffect(effect) {
        //添加缓存,防止重复遍历影响性能
        if (this.active) {
            this.onStop && this.onStop();
            Array.from(effect.deps).forEach((dep) => {
                dep.delete(this);
            });
            this.active = false;
        }
    }
}
function effect(fn, option = {}) {
    const { schedule = null, onStop = null } = option;
    const reactiveEffect = new ReactiveEffect(fn, schedule);
    extend(reactiveEffect, option);
    reactiveEffect.run();
    const res = reactiveEffect.run.bind(reactiveEffect);
    res.instance = reactiveEffect;
    return res;
}

function createGetter(isReadonly = false, isShallow = false) {
    return function (target, key) {
        if (key === "__v_isReactive" /* reactiveFlag.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadOnly" /* reactiveFlag.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isShallow) {
            return res;
        }
        if (!isReadonly) {
            trackEvent(target, key);
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        triggerEvent(target, key);
        return res;
    };
}
const mutableHandlers = {
    get: createGetter(),
    set: createSetter(),
};
const readonlyHandlers = {
    get: createGetter(true),
    set(target, key, value) {
        console.warn("readonly类型不允许被修改");
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: createGetter(true, true),
});

const targetMap = new Map();
function trackEvent(target, key) {
    if (!isTracking()) {
        return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
function trackEffect(dep) {
    dep.add(activeEffect);
    activeEffect.deps.add(dep); //stop功能,收集dep
}
function triggerEvent(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const dep = depsMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    Array.from(dep).forEach((effect) => {
        if (effect.schedule) {
            effect.schedule(); //schedule优先级大于run
        }
        else {
            effect.run();
        }
    });
}
function isTracking() {
    return activeEffect && shouldTrack;
}
function reactive(raw) {
    return createActiveObj(raw, mutableHandlers);
}
function readonly(obj) {
    return createActiveObj(obj, readonlyHandlers);
}
function createActiveObj(obj, type) {
    return new Proxy(obj, type);
}
function shallowReadonly(obj) {
    if (!isObject(obj)) {
        console.warn(`${obj}需要是对象`);
        return obj;
    }
    return createActiveObj(obj, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function camelize(str) {
        let flag;
        const rule = new RegExp("-");
        while ((flag = rule.exec(str)) !== null) {
            const index = flag.index;
            str =
                str.slice(0, index) +
                    str[index + 1].toUpperCase() +
                    str.slice(index + 2);
        }
        return str;
    }
    const handler = props["on" + camelize(capitalize(event))];
    handler && handler(...args);
}

function initSlot(instance, children) {
    const { vnode } = instance;
    const slots = {};
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        for (const key in children) {
            const val = children[key];
            //为什么组件实例的slots对象的每个key对应的value函数返回的值(如:a)都是数组 因为renderSlots中使用的是Fragment a需要作为Fragment节点的children
            slots[key] = (props) => formatValue(val(props));
        }
    }
    instance.slots = slots;
}
function formatValue(value) {
    return Array.isArray(value) ? value : [value];
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this.dep = new Set();
        this._value = convert(value);
        this._rawValue = value; //rawValue是原始值 因为value可能是proxy代理对象
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (isSame(this._rawValue, newValue))
            return;
        this._value = convert(newValue);
        this._rawValue = newValue;
        triggerEffect(this.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffect(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRef(target) {
    return new Proxy(target, {
        get(target, key) {
            return unRef(target[key]);
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

/*
 * @Author: root 931097192@qq.com
 * @Date: 2024-02-05 13:42:35
 * @LastEditors: root 931097192@qq.com
 * @LastEditTime: 2024-02-20 15:34:22
 * @FilePath: \writing-vue3\src\runtime-core\component.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false, //代表该组件实例是否初始化
        subTree: {},
        emit: () => { },
        next: null,
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initSlot(instance, instance.vnode.children);
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type; //组件实例内部包含vnode
    const { setup } = Component;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandler);
    if (setup) {
        setCurrentInstance(instance);
        //可能是object/function类型
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        }) || {};
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //TODO function类型
    if (typeof setupResult === "object") {
        instance.setupState = proxyRef(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render; //设置组件实例的render函数
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
//传入template 返回render
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    //tips:provide inject只可在setup内部使用
    const instance = getCurrentInstance();
    if (instance) {
        let { provides } = instance;
        const parentProvides = instance.parent.provides;
        if (provides === parentProvides) {
            provides = instance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key) {
    const instance = getCurrentInstance();
    if (instance) {
        return instance.parent.provides[key];
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount: function (rootContainer) {
                //后续操作都是基于vnode进行处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer, null);
            },
        };
    };
}

const queue = [];
let isFlushPending = false;
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(() => {
        isFlushPending = false;
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    });
}

function createRenderer(options) {
    const { createElement, patchProp, insert, remove, setElementText } = options;
    function render(n2, container, parentComponent) {
        //只有在createApp().mount函数中执行render 因此一定是初始化
        patch(null, n2, container, parentComponent, null);
    }
    function patch(n1, n2, container, parentComponent, anchor = null) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case "Fragment":
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case "Text":
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        //跳过生成父节点
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const node = (n2.el = document.createTextNode(children));
        container.append(node);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            //初始化逻辑
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdate(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function shouldUpdate(n1, n2) {
        const { props: prevProps } = n1;
        const { props: nextProps } = n2;
        for (let i in prevProps) {
            if (prevProps[i] !== nextProps[i]) {
                return true;
            }
        }
        return false;
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = createElement(type)); //进行vnode的el赋值
        if (props) {
            for (let key in props) {
                const val = props[key];
                patchProp(el, key, null, val);
            }
        }
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent, anchor);
        }
        insert(el, container, anchor);
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        const el = (n2.el = n1.el); //n1在mountElement时赋值el给vnode n2未走mount逻辑 故在此赋值el给n2
        patchChildren(el, n1, n2, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(el, n1, n2, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        const oldChildren = n1.children;
        const newChildren = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            //ArrayToText情况 1.把老的children清空 2.设置新的text
            //TextToText情况 1.设置新的text
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(n1.children);
            }
            if (oldChildren !== newChildren) {
                setElementText(el, newChildren);
            }
        }
        else {
            //TextToArray情况 1.清空children
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                setElementText(el, "");
                mountChildren(newChildren, el, parentComponent, anchor);
            }
            else {
                //ArrayToArray情况
                patchKeyedChildren(oldChildren, newChildren, el, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(oldChildren, newChildren, container, parentComponent, parentAnchor) {
        let e1 = oldChildren.length - 1;
        let e2 = newChildren.length - 1;
        let i = 0;
        function isSomeVnodeType(n1, n2) {
            //从type和key两个角度比较
            //key为什么没有从props中取 因为在创建vnode的时候已经从props中取值并赋值给vnode的key属性了
            return n1.type === n2.type && n1.key === n2.key;
        }
        //左侧
        while (i <= e1 && i <= e2) {
            const n1 = oldChildren[i];
            const n2 = newChildren[i];
            if (isSomeVnodeType(n1, n2)) {
                //如果相同 直接走patch逻辑 更新两个vnode的props和children
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        //右侧
        while (i <= e1 && i <= e2) {
            const n1 = oldChildren[e1];
            const n2 = newChildren[e2];
            if (isSomeVnodeType(n1, n2)) {
                //如果相同 直接走patch逻辑 更新两个vnode的props和children
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            //新的比老的多 创建
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
                while (i <= e2) {
                    patch(null, newChildren[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            //老的比新的多 删除
            while (i <= e1) {
                remove(oldChildren[i].el);
                i++;
            }
        }
        else {
            //中间比对
            let s1 = i, s2 = i;
            //这里是优化点 若newChildren里所有项都patch后 oldChildren多余的项直接remove即可
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i <= e2; i++) {
                const el = newChildren[i];
                //key为vnode的key value为索引
                keyToNewIndexMap.set(el.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const el = oldChildren[i];
                let newIndex;
                if (patched >= toBePatched) {
                    remove(el.el);
                    continue;
                }
                if (el.key) {
                    newIndex = keyToNewIndexMap.get(el.key);
                }
                else {
                    //如果没有设置key oldChildren的每一项和newChildren中的元素进行比对
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVnodeType(el, newChildren[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (!newIndex) {
                    remove(el.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(el, newChildren[newIndex], container, parentComponent);
                    patched++;
                }
            }
            //获取最长递增子序列
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = newChildren[nextIndex];
                const anchor = nextIndex + 1 < newChildren.length ? newChildren[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        insert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i <= children.length - 1; i++) {
            const el = children[i].el;
            remove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        for (let key in newProps) {
            const oldProp = oldProps[key];
            const newProp = newProps[key];
            if (oldProp !== newProp) {
                patchProp(el, key, oldProp, newProp);
            }
        }
        for (let key in oldProps) {
            if (!(key in newProps)) {
                patchProp(el, key, oldProps[key], null);
            }
        }
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((child) => patch(null, child, container, parentComponent, anchor));
    }
    function mountComponent(vnode, container, parentComponent, anchor) {
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, vnode, container, anchor);
    }
    function setupRenderEffect(instance, vnode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                //如果是初始化时，走此逻辑创建节点
                const { proxy } = instance;
                //在这里将初始化的子节点放到subTree中。
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                //next是即将要更新的vnode vnode是更新之前的vnode
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                //新节点
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                //再次更新子节点
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            schedule() {
                queueJobs(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVnode) {
        instance.vnode = nextVnode;
        instance.next = null;
        instance.props = nextVnode.props;
    }
    return {
        createApp: createAppAPI(render),
    };
}
//求最长递增子序列函数
function getSequence(arr) {
    const predecessors = arr.slice();
    const sequenceIndices = [0];
    let currentIndex, lastIndexOfSequence, low, high, mid, comparisonResult;
    const length = arr.length;
    for (currentIndex = 0; currentIndex < length; currentIndex++) {
        const currentElement = arr[currentIndex];
        if (currentElement !== 0) {
            lastIndexOfSequence = sequenceIndices[sequenceIndices.length - 1];
            if (arr[lastIndexOfSequence] < currentElement) {
                predecessors[currentIndex] = lastIndexOfSequence;
                sequenceIndices.push(currentIndex);
                continue;
            }
            low = 0;
            high = sequenceIndices.length - 1;
            while (low < high) {
                mid = (low + high) >> 1;
                comparisonResult = arr[sequenceIndices[mid]] < currentElement ? 1 : 0;
                if (comparisonResult) {
                    low = mid + 1;
                }
                else {
                    high = mid;
                }
            }
            if (currentElement < arr[sequenceIndices[low]]) {
                if (low > 0) {
                    predecessors[currentIndex] = sequenceIndices[low - 1];
                }
                sequenceIndices[low] = currentIndex;
            }
        }
    }
    currentIndex = sequenceIndices.length;
    lastIndexOfSequence = sequenceIndices[currentIndex - 1];
    while (currentIndex-- > 0) {
        sequenceIndices[currentIndex] = lastIndexOfSequence;
        lastIndexOfSequence = predecessors[lastIndexOfSequence];
    }
    return sequenceIndices;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, oldProp, newProp) {
    function isOn(key) {
        //鉴别该属性是否是事件
        return /^on[A-Z]/.test(key);
    }
    if (isOn(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), newProp);
    }
    else {
        if (newProp === undefined || newProp === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newProp);
        }
    }
}
function insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(container, text) {
    container.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp() {
    return renderer.createApp(...arguments);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVnode: createTextVnode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

function compileToFunction(template) {
    const { code } = baseCompiler();
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
//runtime和compiler进行交互
registerRuntimeCompiler(compileToFunction);

exports.baseCompiler = baseCompiler;
exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVnode = createTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRef = proxyRef;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
