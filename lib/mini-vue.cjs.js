'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    //TODO initProps initSlot
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type; //组件实例内部包含vnode
    const { setup } = Component;
    if (setup) {
        //可能是object/function类型
        const setupResult = setup();
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

function render(vnode, container) {
    patch(vnode);
}
function patch(vnode, container) {
    //TODO 处理element类型
    processComponent(vnode);
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            //后续操作都是基于vnode进行处理
            const vnode = createVNode(rootComponent);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
