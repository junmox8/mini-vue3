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
                const subTree = (instance.subTree = instance.render.call(proxy));
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
                const subTree = instance.render.call(proxy);
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

export { createApp, createRenderer, createTextVnode, getCurrentInstance, h, inject, nextTick, provide, proxyRef, ref, renderSlots };
