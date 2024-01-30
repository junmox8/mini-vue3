'use strict';

function createVNode(type, children, props) {
    const vnode = {
        type,
        props,
        children,
        el: null, //方便后续$el取值
        shapeFlag: getShapeFlag(type),
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
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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

const extend = Object.assign;
function isObject(val) {
    return val && typeof val === "object";
}
function isSame(val, newVal) {
    return val === newVal;
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

function createComponentInstance(vnode, parent) {
    console.log("parent", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false, //代表该组件实例是否初始化
        emit: () => { },
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
    if (Component.render) {
        instance.render = Component.render; //设置组件实例的render函数
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
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

function createRenderer(options) {
    const { createElement, patchProps, insert } = options;
    function render(n2, container, parentComponent) {
        //只有在createApp().mount函数中执行render 因此一定是初始化
        patch(null, n2, container, parentComponent);
    }
    function patch(n1, n2, container, parentComponent) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case "Fragment":
                processFragment(n1, n2, container, parentComponent);
                break;
            case "Text":
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        //跳过生成父节点
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const node = (n2.el = document.createTextNode(children));
        container.append(node);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            //初始化逻辑
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = createElement(type)); //进行vnode的el赋值
        if (props) {
            patchProps(props, el);
        }
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent);
        }
        insert(el, container);
    }
    function patchElement(n1, n2, container) {
        console.log(n2);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((child) => patch(null, child, container, parentComponent));
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, vnode, container);
    }
    function setupRenderEffect(instance, vnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                //如果是初始化时，走此逻辑创建节点
                const { proxy } = instance;
                //在这里将初始化的子节点放到subTree中。
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                //新节点
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                //再次更新子节点
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(props, el) {
    function isOn(key) {
        //鉴别该属性是否是事件
        return /^on[A-Z]/.test(key);
    }
    for (let key in props) {
        if (isOn(key)) {
            el.addEventListener(key.slice(2).toLowerCase(), props[key]);
        }
        else {
            el.setAttribute(key, props[key]);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
});
function createApp() {
    return renderer.createApp(...arguments);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVnode = createTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRef = proxyRef;
exports.ref = ref;
exports.renderSlots = renderSlots;
