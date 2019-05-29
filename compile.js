class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? le: document.querySelector(el);
        this.vm = vm;

        if (this.el) {
            // 如果这个元素获取到才编译
            // 1. 先把真实的DOM移入内存中 fragment
            let fragment = this.node2fragment(this.el);
            // 2. 编译： 提取想要的元素 v-model 和文本节点 {{}}
            this.compile(fragment);
            // 3. 把编译好的fragment塞回页面中
            this.el.appendChild(fragment);
        }
    }
    // 专门写一些辅助方法
    isElementNode(node) {
        return node.nodeType == 1;
    }

    isDirective(name) {
        return name.includes("v-");
    }

    // 核心的方法
    compileElement(node) {
        // 带 v-model
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            // 判断属性名字是否包含 v-model 
            let attrName = attr.name
            if (this.isDirective(attrName)) {
                let expr = attr.value;
                let [,type] = attrName.split('-'); // 获取 v-model中的model
                CompileUtils[type](node, this.vm, expr)
            }
        })
    }

    compileText(node) {
        let expr = node.textContent;
        let reg = /\{\{([^{]+)\}\}/g;
        if (reg.test(expr)) {
            CompileUtils['text'](node, this.vm, expr);
        }
    }

    compile(fragment){
        // 需要递归获取节点
        let childNodes = fragment.childNodes;
        // node的类数组转换为数组遍历
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 这里需要编译元素
                this.compileElement(node);
                // 递归编译深层节点
                this.compile(node);
            } else {
                // 这里需要编译模板表达式
                this.compileText(node);
            }
        })
    }

    // 通过内存碎片移入节点
    node2fragment(el) {
        let fragment = document.createDocumentFragment();
        let firstChild;
        // 每次移入最上面的节点
        while(firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment;
    }
}

CompileUtils = {
    getVal(vm,expr) { // 在vm中获取 mesaage.a.b 的值
        expr = expr.split('.');  // 分割成数组 [message, a, b]
        return expr.reduce((prev,next) => { // reduce 一步一步取值
            return prev[next];
        },vm.$data)
    },
    setVal(vm,expr,value){
        expr = expr.split(".");
        return expr.reduce((prev, next,currentIndex) => {
            if (currentIndex === expr.length -1) {
                return prev[next] = value;
            }
            return prev[next];
        },vm.$data);
    },
    getTextVal(vm,expr) { // 获取 {{message}} 表达式在vm的值
        return expr.replace(/\{\{([^{}]+)\}\}/g, (...agrs) => {
            // console.log("agrs",agrs)
            // 这里是正则的匹配用法，agrs[1]就是里面的内容
            return this.getVal(vm, agrs[1]);
        })
    },
    text(node, vm ,expr) { // 文本框处理
        let updaterFn = this.updater['textUpdater'];
        // {{a}} 这里同样需要去除 {{}} 获取 a 
        expr.replace(/\{\{([^{}]+)\}\}/g, (...agrs) => {
            new Watcher(vm, agrs[1],(newValue) => {
                // 如何数据变化，文本节点需要重新依赖属性更新文本中的内容
                updaterFn && updaterFn(node, this.getTextVal(vm,expr))
            })
        })
        updaterFn && updaterFn(node, this.getTextVal(vm,expr))
    },
    model(node, vm, expr) { // 输入框处理
        let updaterFn = this.updater['modelUpdater'];
        // 增加一个监控，数据变化了，应该调用这个callback
        new Watcher(vm,expr,(newValue) => {
            // 当值变化后供调用来更新新的值
            updaterFn && updaterFn(node, this.getVal(vm,expr))
        })
        // 增加监听事件在输入框变化的时候通知数据变化
        node.addEventListener("input", (e) => {
            let newValue = e.target.value;
            this.setVal(vm,expr,newValue)
        })
        updaterFn && updaterFn(node, this.getVal(vm,expr))
    },
    updater: {
        // 文本赋值
        textUpdater(node, value) {
            node.textContent = value;
        },
        // 输入框赋值
        modelUpdater(node, value) {
            node.value = value;
        }
    }
}