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
        instance.setupState = setupResult;
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

function render(vnode, container, parentComponent) {
    patch(vnode, container, parentComponent);
}
function patch(vnode, container, parentComponent) {
    const { type, shapeFlag } = vnode;
    switch (type) {
        case "Fragment":
            processFragment(vnode, container, parentComponent);
            break;
        case "Text":
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}
function processFragment(vnode, container, parentComponent) {
    //跳过生成父节点
    mountChildren(vnode.children, container, parentComponent);
}
function processText(vnode, container) {
    const { children } = vnode;
    const node = (vnode.el = document.createTextNode(children));
    container.append(node);
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = document.createElement(type)); //进行vnode的el赋值
    if (props) {
        for (let key in props) {
            if (isOn(key)) {
                el.addEventListener(key.slice(2).toLowerCase(), props[key]);
            }
            else {
                el.setAttribute(key, props[key]);
            }
        }
    }
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
    }
    container.append(el);
}
function mountChildren(children, container, parentComponent) {
    children.forEach((child) => patch(child, container, parentComponent));
}
function mountComponent(vnode, container, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container, instance); //
    vnode.el = subTree.el;
}
function isOn(key) {
    //鉴别该属性是否是事件
    return /^on[A-Z]/.test(key);
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            //后续操作都是基于vnode进行处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer, null);
        },
    };
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

exports.createApp = createApp;
exports.createTextVnode = createTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
