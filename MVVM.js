class MVVM {
    constructor(options) {
        // 1. 一上来，先把可用的东西挂载到实例上
        this.$el = options.el;
        this.$data = options.data;

        //2. 有编译的模板才编译
        if (this.$el) {
            // 数据劫持，把数据的所有属性改成 get和set方法
            new Observer(this.$data);
            // 把vm.$data下面的属性代理到vm下面，这样可以方便的取用
            this.proxyData(this.$data);

            // 用数据和元素进行编译
            new Compile(this.$el, this);
        }
    }
    proxyData(data) {
        Object.keys(data).forEach(key=>{
            Object.defineProperty(this, key, {
                get() {
                    return data[key];
                },
                set(newValue) {
                    data[key] = newValue;
                }
            })
        })
    }

}