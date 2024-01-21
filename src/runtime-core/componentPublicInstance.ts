const publicPropertiesMap = {
  //需要注意 返回的是组件的虚拟节点的el 所以后续在注册完元素后获取el 需要挂载到组件节点上。
  $el: (instance) => instance.vnode.el,
};

export const PublicInstanceProxyHandler = {
  get({ _: instance }, key) {
    if (key in instance.setupState) {
      return instance.setupState[key];
    }
    const PublicGetter = publicPropertiesMap[key];
    if (PublicGetter) {
      return PublicGetter(instance);
    }
  },
};
